import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { VerifyResetPasswordTokenCommand } from '@/users/application/command/impl/verify-reset-password-token.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(VerifyResetPasswordTokenCommand)
export class VerifyResetPasswordTokenHandler
  implements ICommandHandler<VerifyResetPasswordTokenCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: VerifyResetPasswordTokenCommand) {
    const { resetPasswordVerifyToken } = command;

    const userEntity = await this.userRepository.findByResetPasswordVerifyToken(
      resetPasswordVerifyToken,
    );

    const response = {} as IRes<IUser>;
    const user = {} as IUser;

    if (userEntity === null) {
      response.success = false;
      response.message = 'Invalid reset password verification code';
      response.data = null;

      return response;
    }

    user.id = userEntity.id;
    user.email = userEntity.email;
    user.userName = userEntity.userName;

    response.success = true;
    response.message = 'Reset password token verified successfully';
    response.data = user;

    return response;
  }
}
