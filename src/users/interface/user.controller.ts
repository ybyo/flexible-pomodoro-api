import { UpdatePasswordCommand } from '@/users/application/command/impl/update-password.command';
import { PasswordResetDto } from '@/users/interface/dto/password-reset.dto';
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import accessTokenConfig from '@/config/accessTokenConfig';
import { AddResetTokenCommand } from '@/users/application/command/impl/add-reset-token.command';
import { AuthService } from '@/auth/auth.service';
import { CheckEmailCommand } from '@/auth/command/impl/check-email.command';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ConfigType } from '@nestjs/config';
import { IEmailService } from '@/users/application/adapter/iemail.service';
import { IRes, IUser } from '@/type-defs/message.interface';
import { PasswordResetGuard } from '@/users/common/guard/password-reset.guard';
import { Request, Response } from 'express';
import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';
import { VerifyResetPasswordTokenCommand } from '@/users/application/command/impl/verify-reset-password-token.command';
import { ulid } from 'ulid';

@Controller('users')
export class UserController {
  constructor(
    private commandBus: CommandBus,
    private eventBus: EventBus,
    private authService: AuthService,
    @Inject('EmailService') private emailService: IEmailService,
    @Inject(accessTokenConfig.KEY)
    private accessConf: ConfigType<typeof accessTokenConfig>,
  ) {}

  @Get('verify-email')
  async verifyEmail(@Query() query): Promise<string> {
    const { signupVerifyToken } = query;
    const command = new VerifyEmailCommand(signupVerifyToken);

    return await this.commandBus.execute(command);
  }

  @Post('reset-password')
  async resetPass(@Body() data): Promise<IRes<any>> {
    const { email } = data;
    const command = new CheckEmailCommand(email);

    const response = await this.commandBus.execute(command);

    // Email exists, sending email
    if (response.success === false) {
      const res = {} as IRes<any>;

      try {
        const resetPasswordVerifyToken = ulid();
        await this.emailService.sendPasswordResetVerification(
          email,
          resetPasswordVerifyToken,
        );

        const command = new AddResetTokenCommand(
          email,
          resetPasswordVerifyToken,
        );

        const response = await this.commandBus.execute(command);

        res.success = true;
        res.message = 'Reset password verification email sent successfully.';

        return res;
      } catch (err) {
        // res.success = false;
        // res.message = err;
        console.log(err);

        return null;
      }
    }

    return null;
  }

  @Get('verify-reset-password')
  async verifyResetPassword(
    @Query() query,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes<IUser>> {
    const { resetPasswordVerifyToken } = query;
    const command = new VerifyResetPasswordTokenCommand(
      resetPasswordVerifyToken,
    );

    const result: IRes<IUser> = await this.commandBus.execute(command);
    const user = result.data;

    if (user !== null) {
      const accessToken = await this.authService.issueToken(user as IUser);

      res.cookie('resetPasswordToken', accessToken, this.accessConf);
    }

    return result;
  }

  @UseGuards(PasswordResetGuard)
  @Post('post-password-reset')
  async resetPassword(
    @Req() req: Request,
    @Body() body: PasswordResetDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const newPassword = body.password;
    let resetPasswordToken;

    if ('resetPasswordToken' in req.cookies) {
      resetPasswordToken = req.cookies.resetPasswordToken;
    }

    let response = {} as IRes<void>;

    const user = await this.authService.verifyJwt(resetPasswordToken);

    const command = new UpdatePasswordCommand(user.data.email, newPassword);
    response = await this.commandBus.execute(command);

    if (response.success === true) {
      res.cookie('resetPasswordToken', null, { ...this.accessConf, maxAge: 1 });
    }

    return response;
  }
}
