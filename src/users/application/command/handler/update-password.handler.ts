import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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

    if (user) {
      await this.userRepository.updateUser(
        { email },
        { password: newPassword },
      );

      return { success: true };
    }

    throw new InternalServerErrorException('Cannot update password');
  }
}
