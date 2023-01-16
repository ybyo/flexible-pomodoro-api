import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from '@/auth/auth.service';
import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

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
      throw new UnauthorizedException('Invalid email verification code');
    }

    if (!user.isVerified) {
      await this.userRepository.updateUser(
        { signupVerifyToken: signupVerifyToken },
        { isVerified: true },
      );
    } else {
      throw new BadRequestException('Already verified email');
    }

    return this.authService.issueToken({
      id: user.id,
      userName: user.userName,
      email: user.email,
    });
  }
}
