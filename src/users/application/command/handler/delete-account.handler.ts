import { DeleteAccountCommand } from '@/users/application/command/impl/delete-account.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@Injectable()
@CommandHandler(DeleteAccountCommand)
export class DeleteAccountHandler
  implements ICommandHandler<DeleteAccountCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: DeleteAccountCommand) {
    const { email } = command;
    return await this.userRepository.deleteUser(email);
  }
}
