import {
  BadRequestException,
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
import { ConfigType } from '@nestjs/config';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { ulid } from 'ulid';

import { AuthService } from '@/auth/auth.service';
import { CheckEmailDupCmd } from '@/auth/command/impl/check-email-dup.cmd';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import accessTokenConfig from '@/config/accessTokenConfig';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { IEmailService } from '@/users/application/adapter/iemail.service';
import { AddResetTokenCmd } from '@/users/application/command/impl/add-reset-token.cmd';
import { ChangeEmailCommand } from '@/users/application/command/impl/change-email.command';
import { ChangeNameCommand } from '@/users/application/command/impl/change-name.command';
import { CreateTimestampCommand } from '@/users/application/command/impl/create-timestamp.command';
import { DeleteAccountCommand } from '@/users/application/command/impl/delete-account.command';
import { UpdatePasswordCommand } from '@/users/application/command/impl/update-password.command';
import { VerifyChangeEmailCommand } from '@/users/application/command/impl/verify-change-email.command';
import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';
import { VerifyResetPasswordTokenCmd } from '@/users/application/command/impl/verify-reset-password-token.cmd';
import { PasswordResetGuard } from '@/users/common/guard/password-reset.guard';
import { RedisTokenGuard } from '@/users/common/guard/redis-token.guard';
import { ChangeUsernameDto } from '@/users/interface/dto/change-username.dto';
import { DeleteAccountDto } from '@/users/interface/dto/delete-account.dto';
import { PasswordResetDto } from '@/users/interface/dto/password-reset.dto';

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

  @UseGuards(RedisTokenGuard)
  @Get('verify-email')
  async verifyEmail(@Query() query): Promise<string> {
    const { signupVerifyToken } = query;
    const command = new VerifyEmailCommand(signupVerifyToken);

    return await this.commandBus.execute(command);
  }

  @Post('reset-password')
  async sendResetPasswordEmail(@Body() data): Promise<IRes<any>> {
    const { email } = data;

    const command = new CheckEmailDupCmd(email);
    const result = await this.commandBus.execute(command);

    if (result.success === false) {
      const resetPasswordVerifyToken = await this.authService.issueUlid();
      await this.emailService.sendPasswordResetVerification(
        email,
        resetPasswordVerifyToken,
      );

      const command = new AddResetTokenCmd(email, resetPasswordVerifyToken);
      await this.commandBus.execute(command);

      return {
        success: true,
        message: 'Reset password verification email sent successfully.',
      };
    }

    return {
      success: false,
      message: 'Email does not exist.',
    };
  }

  @Get('verify-reset-password-token')
  async verifyResetPassword(
    @Query() query,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes<IUser>> {
    const { resetPasswordVerifyToken: token } = query;

    const command = new VerifyResetPasswordTokenCmd(token);
    const result: IRes<IUser> = await this.commandBus.execute(command);
    const user: IUser = result.data;

    if (user !== null) {
      const accessToken = await this.authService.issueToken(user);
      res.cookie('resetPasswordToken', accessToken, this.accessConf);
    }

    return result;
  }

  @UseGuards(PasswordResetGuard)
  @Post('reset-password')
  async resetPassword(
    @Req() req: Request,
    @Body() body: PasswordResetDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes> {
    const newPassword = body.password;
    let resetPasswordToken;
    let response = {} as IRes<void>;

    if ('resetPasswordToken' in req.cookies) {
      resetPasswordToken = req.cookies.resetPasswordToken;
      const user = await this.authService.verifyJwt(resetPasswordToken);
      const command = new UpdatePasswordCommand(user.data.email, newPassword);
      response = await this.commandBus.execute(command);
      if (response.success === true) {
        res.cookie('resetPasswordToken', null, {
          ...this.accessConf,
          maxAge: 1,
        });
        const command = new AddResetTokenCmd(user.data.email, null);
        await this.commandBus.execute(command);
      }

      return response;
    }

    return { success: false };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(
    @Req() req: Request,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    let oldEmail;
    let uid;
    if ('email' in req.user && 'id' in req.user) {
      oldEmail = req.user.email;
      uid = req.user.id;
    }
    const newEmail = body.email;
    const changeEmailVerifyToken = ulid();
    const command = new ChangeEmailCommand(
      oldEmail,
      newEmail,
      changeEmailVerifyToken,
    );
    const response = await this.commandBus.execute(command);

    if (response.success === true) {
      try {
        await this.emailService.sendChangeEmailVerification(
          newEmail,
          changeEmailVerifyToken,
        );

        const command = new CreateTimestampCommand(
          uid,
          `changeEmailTokenCreated`,
        );
        const response = await this.commandBus.execute(command);
      } catch (err) {
        console.log(err);
      }
    }

    return {
      success: true,
      message: 'Change email verification email sent successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-change-email')
  async verifyChangeEmail(
    @Req() req: Request,
    @Query() query: any,
    @Res({ passthrough: true }) res,
  ) {
    let changeEmailVerifyToken;
    if ('changeEmailVerifyToken' in query) {
      changeEmailVerifyToken = query.changeEmailVerifyToken;
    }
    let response = {} as IRes<IUser>;
    response.success = false;
    const command = new VerifyChangeEmailCommand(changeEmailVerifyToken);
    response = await this.commandBus.execute(command);

    if (response.success === true) {
      const newUser: IUser = response.data;
      const accessToken = await this.authService.issueToken(newUser);
      res.cookie('accessToken', accessToken, this.accessConf);

      return response;
    } else {
      throw new BadRequestException(
        'Something went wrong. Change email reverted',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-name')
  async changeName(
    @Req() req: Request,
    @Body() body: ChangeUsernameDto,
    @Res({ passthrough: true }) res,
  ): Promise<IRes> {
    const { newName } = body;
    const { email } = req.user as IUser;

    const command = new ChangeNameCommand(email, newName);
    const response = await this.commandBus.execute(command);
    if (response.success === true) {
      const newUser: IUser = response.data;
      const accessToken = await this.authService.issueToken(newUser);
      res.cookie('accessToken', accessToken, this.accessConf);

      return response;
    }

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  async deleteAccount(
    @Req() req: Request,
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) res,
  ): Promise<IRes> {
    let email: string | null;
    if ('email' in req.user) {
      email = req.user.email as string;
    }

    if (email !== null) {
      const command = new DeleteAccountCommand(email);
      return await this.commandBus.execute(command);
    }

    return {
      success: false,
      message: 'Cannot delete account. Please try again.',
    };
  }
}
