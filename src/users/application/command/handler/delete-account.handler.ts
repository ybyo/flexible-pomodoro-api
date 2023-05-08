import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DeleteAccountCmd } from '@/users/application/command/impl/delete-account.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(DeleteAccountCmd)
export class DeleteAccountHandler implements ICommandHandler<DeleteAccountCmd> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: DeleteAccountCmd) {
    const { id } = command;

    const result = await this.userRepository.deleteUser(id);

    return result;
  }
}
