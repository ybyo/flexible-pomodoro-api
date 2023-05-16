import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { VerifyResetPasswordTokenCommand } from '@/users/application/command/impl/verify-reset-password-token.command';
import { IUserRepository } from '@/users/domain/iuser.repository';
import { UserJwt } from '@/users/domain/user.model';

@Injectable()
@CommandHandler(VerifyResetPasswordTokenCommand)
export class VerifyResetPasswordTokenHandler
  implements ICommandHandler<VerifyResetPasswordTokenCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: VerifyResetPasswordTokenCommand): Promise<any> {
    const userEntity = await this.userRepository.findByResetPasswordToken(
      command.resetPasswordToken,
    );

    if (userEntity === null) {
      return {
        success: false,
        message: 'Invalid reset password verification code',
        data: null,
      };
    }

    const user: UserJwt = {
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
    };

    return {
      success: true,
      message: 'Reset password token verified successfully',
      data: user,
    };
  }
}
