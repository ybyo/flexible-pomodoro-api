import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { CreateTimestampCmd } from '@/users/application/command/impl/create-timestamp.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(CreateTimestampCmd)
export class CreateTimestampHandler
  implements ICommandHandler<CreateTimestampCmd>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: CreateTimestampCmd) {
    const { id, target } = command;
    const response = {} as IRes;

    await this.userRepository.updateUser({ id }, { [`${target}`]: new Date() });

    response.success = true;
    response.message = `The timestamp for ${target} has been successfully set`;

    return response;
  }
}
