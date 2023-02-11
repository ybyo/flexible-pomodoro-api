import {
  Controller,
  Get,
  Inject,
  Logger,
  LoggerService,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { CommandBus } from '@nestjs/cqrs';
import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';

@Controller('user')
export class UsersController {
  constructor(
    @Inject(Logger) private readonly logger: LoggerService,
    private authService: AuthService,
    private commandBus: CommandBus,
  ) {}

  @Get('verify-email')
  async verifyEmail(
    @Req() req,
    @Query() query,
    @Res({ passthrough: true }) res,
  ): Promise<string> {
    const { signupVerifyToken } = query;

    const command = new VerifyEmailCommand(signupVerifyToken);

    const result = await this.commandBus.execute(command);

    // if ('success' in result && result.success === false) {
    //   return result;
    // } else {
    //   return result;
    // }
    return result;
  }
}
