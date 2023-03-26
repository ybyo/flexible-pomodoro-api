import { CheckEmailCommand } from '@/auth/command/impl/check-email.command';
import { IRes } from '@/type-defs/message.interface';
import { IEmailService } from '@/users/application/adapter/iemail.service';
import { AddResetTokenCommand } from '@/users/application/command/impl/add-reset-token.command';
import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';
import { VerifyResetPasswordTokenCommand } from '@/users/application/command/impl/verify-reset-password-token.command';
import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ulid } from 'ulid';

@Controller('users')
export class UserController {
  constructor(
    private commandBus: CommandBus,
    private eventBus: EventBus,
    @Inject('EmailService') private emailService: IEmailService,
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
}
