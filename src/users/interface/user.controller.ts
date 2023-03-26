import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';
import { Controller, Get, Query } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

@Controller('users')
export class UserController {
  constructor(private commandBus: CommandBus) {}

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
        await this.emailService.sendPasswordResetVerification(email, ulid());

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
}
