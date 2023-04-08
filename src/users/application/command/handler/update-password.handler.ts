import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { UpdatePasswordCommand } from '@/users/application/command/impl/update-password.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordHandler
  implements ICommandHandler<UpdatePasswordCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: UpdatePasswordCommand) {
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
