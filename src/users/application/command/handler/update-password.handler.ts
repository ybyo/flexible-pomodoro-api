import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { UpdatePasswordCmd } from '@/users/application/command/impl/update-password.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(UpdatePasswordCmd)
export class UpdatePasswordHandler
  implements ICommandHandler<UpdatePasswordCmd>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: UpdatePasswordCmd) {
    const { email, newPassword } = command;

    const user = await this.userRepository.findByEmail(email);

    const response = {} as IRes<void>;

    if (user === null) {
      response.success = false;
      response.message = 'No user found with the matching information.';
      return response;
    } else {
      try {
        await this.userRepository.updateUser(
          { email },
          { password: newPassword },
        );
      } catch (err) {
        console.log(err);
      }
    }

    response.success = true;
    response.message = 'The password updated successfully.';

    return response;
  }
}
