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
}
