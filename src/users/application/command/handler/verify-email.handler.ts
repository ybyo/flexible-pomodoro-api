import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from '@/auth/auth.service';
import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';

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

    const response = {} as IRes<IUser>;

    if (user === null) {
      response.success = false;
      response.message = 'Invalid email verification code';
      return response;
    }

    if (!user.isVerified) {
      await this.userRepository.updateUser(
        { signupVerifyToken: signupVerifyToken },
        { isVerified: true },
      );
    } else {
      response.success = true;
      response.message = 'Already verified email';
      return response;
    }

    response.success = true;
    response.message = 'Email verified';

    return response;
  }
}
