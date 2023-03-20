import {
  Controller,
  Get,
  Inject,
  Logger,
  LoggerService,
  Query,
  Req,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { CommandBus } from '@nestjs/cqrs';
import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';

@Controller('user')
export class UserController {
  constructor(private commandBus: CommandBus) {}

  @Get('verify-email')
  async verifyEmail(@Req() req, @Query() query): Promise<string> {
    const { signupVerifyToken } = query;

    const command = new VerifyEmailCommand(signupVerifyToken);

    const result = await this.commandBus.execute(command);

    return result;
  }
}
