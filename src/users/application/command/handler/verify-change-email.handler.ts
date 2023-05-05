import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes, IUser }          from '@/customTypes/interfaces/message.interface';
import { VerifyChangeEmailCmd } from '@/users/application/command/impl/verify-change-email.cmd';
import { IUserRepository }      from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(VerifyChangeEmailCmd)
export class VerifyChangeEmailHandler
  implements ICommandHandler<VerifyChangeEmailCmd>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}
  async execute(command: VerifyChangeEmailCmd) {
    // 토큰을 가지고 있는지 확인
    const { changeEmailVerifyToken } = command;
    const response = {} as IRes<IUser>;

    const user = await this.userRepository.findByChangeEmailToken(
      changeEmailVerifyToken,
    );

    if (user !== null) {
      try {
        await this.userRepository.updateUser(
          { id: user.id },
          {
            email: user.newEmail,
            changeEmailToken: null,
            changeEmailTokenCreated: null,
            newEmail: null,
          },
        );
        response.success = true;
        response.data = {
          id: user.id,
          userName: user.userName,
          email: user.newEmail,
        };
      } catch (err) {
        console.log(err);
        response.success = false;
      }
    }

    return response;
  }
}
