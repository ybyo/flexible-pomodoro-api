import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { VerifyChangeEmailCmd } from '@/users/application/command/impl/verify-change-email.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(VerifyChangeEmailCmd)
export class VerifyChangeEmailHandler
  implements ICommandHandler<VerifyChangeEmailCmd>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}
  async execute(cmd: VerifyChangeEmailCmd) {
    const { changeEmailToken } = cmd;

    const user = await this.userRepository.findByToken(
      'changeEmailToken',
      changeEmailToken,
    );

    await this.userRepository.updateUser(
      { id: user.id },
      {
        email: user.newEmail,
        changeEmailToken: null,
        changeEmailTokenCreated: null,
        newEmail: null,
      },
    );

    return {
      success: true,
      data: {
        id: user.id,
        userName: user.userName,
        email: user.newEmail,
      },
    };
  }
}
