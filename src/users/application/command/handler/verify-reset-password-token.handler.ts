import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { VerifyResetPasswordTokenCmd } from '@/users/application/command/impl/verify-reset-password-token.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(VerifyResetPasswordTokenCmd)
export class VerifyResetPasswordTokenHandler
  implements ICommandHandler<VerifyResetPasswordTokenCmd>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(
    command: VerifyResetPasswordTokenCmd,
  ): Promise<IRes<IUser | null>> {
    const { resetPasswordToken } = command;
    const userEntity = await this.userRepository.findByToken(
      'resetPasswordToken',
      resetPasswordToken,
    );

    if (userEntity === null) {
      return {
        success: false,
        message: 'Invalid reset password verification code',
        data: null,
      };
    }

    const user: IUser = {
      id: userEntity.id,
      email: userEntity.email,
      userName: userEntity.userName,
    };

    return {
      success: true,
      message: 'Reset password token verified successfully',
      data: user,
    };
  }
}
