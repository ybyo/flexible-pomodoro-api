import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { ChangeNameCmd } from '@/users/application/command/impl/change-name.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(ChangeNameCmd)
export class ChangeNameHandler implements ICommandHandler<ChangeNameCmd> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: ChangeNameCmd): Promise<IRes> {
    const { email, newName } = command;

    const result = await this.userRepository.updateUser(
      { email },
      { userName: newName },
    );

    if (result.success === true) return { success: true };

    throw new InternalServerErrorException('Cannot change username');
  }
}
