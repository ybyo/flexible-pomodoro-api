import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CheckEmailDupCmd } from '@/auth/command/impl/check-email-dup.cmd';
import { IRes } from '@/customTypes/interfaces/message.interface';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(CheckEmailDupCmd)
export class CheckEmailDupHandler implements ICommandHandler<CheckEmailDupCmd> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: CheckEmailDupCmd): Promise<IRes<any>> {
    const { email } = command;
    const user = await this.userRepository.findByEmail(email);

    if (user !== null) {
      return { success: false, data: user };
    }

    return { success: true, data: email };
  }
}
