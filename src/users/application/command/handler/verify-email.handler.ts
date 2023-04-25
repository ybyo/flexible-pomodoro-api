import { Inject, Injectable } from '@nestjs/common';
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
      return {
        success: false,
        message: 'Invalid email verification code',
      };
    }

    if (user.signupVerifyToken !== null) {
      await this.userRepository.updateUser(
        { id: user.id },
        { signupVerifyToken: null },
      );

      return {
        success: true,
        message: 'Email verified',
      };
    }

    return {
      success: true,
      message: 'Already verified email',
    };
  }
}
