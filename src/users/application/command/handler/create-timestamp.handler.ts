import { AuthService } from '@/auth/auth.service';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { CreateTimestampCommand } from '@/users/application/command/impl/create-timestamp.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@Injectable()
@CommandHandler(CreateTimestampCommand)
export class CreateTimestampHandler
  implements ICommandHandler<CreateTimestampCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: CreateTimestampCommand) {
    const { id, target } = command;
    const response = {} as IRes;

    await this.userRepository.updateUser({ id }, { [`${target}`]: new Date() });

    response.success = true;
    response.message = `The timestamp for ${target} has been successfully set`;

    return response;
  }
}
