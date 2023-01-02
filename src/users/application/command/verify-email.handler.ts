import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyEmailCommand } from './verify-email.command';
import { AuthService } from '@/auth/auth.service';
import { IUserRepository } from '../../domain/repository/iuser.repository';

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async execute(command: VerifyEmailCommand) {
    const { signupVerifyToken } = command;

    const user = await this.userRepository.findBySignupVerifyToken(
      signupVerifyToken,
    );

    if (user === null) {
      // TODO: 프론트에서 출력되는 오류 메시지 변경
      throw new UnprocessableEntityException('유효하지 않은 인증 코드 입니다.');
    }

    // TODO: 이미 인증된 경우 처리 로직 수정
    await this.userRepository.updateUser(
      { signupVerifyToken: signupVerifyToken },
      { isVerified: true },
    );

    return this.authService.issueToken({
      userId: user.getUserId(),
      userName: user.getUserName(),
      email: user.getEmail(),
    });
  }
}
