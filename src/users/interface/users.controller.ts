import {
  Controller,
  Inject,
  Logger,
  LoggerService,
  Post,
  Query,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { CommandBus } from '@nestjs/cqrs';
import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('user')
export class UsersController {
  constructor(
    @Inject(Logger) private readonly logger: LoggerService,
    private authService: AuthService,
    private commandBus: CommandBus,
  ) {}

  // TODO: 계정 인증 시, 로그에 액세스 토큰이 프론트로 전송됐는지 여부와 생성된 계정 정보만 출력하도록 수정
  @Post('verify-email')
  async verifyEmail(@Query() dto: VerifyEmailDto): Promise<string> {
    const { signupVerifyToken } = dto;

    const command = new VerifyEmailCommand(signupVerifyToken);

    return this.commandBus.execute(command);
  }
}
