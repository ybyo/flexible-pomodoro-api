import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CheckEmailDupCmd } from '@/auth/command/impl/check-email-dup.cmd';
import { IRes } from '@/customTypes/interfaces/message.interface';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(CheckEmailDupCmd)
export class CheckEmailHandler implements ICommandHandler<CheckEmailDupCmd> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: CheckEmailDupCmd) {
    const { email } = command;

    const { email: foundEmail } = (await this.userRepository.findByEmail(
      email,
    )) || { email: 'dummy' };

    if (foundEmail !== 'dummy') {
      const response = {} as IRes<any>;
      response.success = false;

      return response;
    }

    const response = {} as IRes<any>;
    response.success = true;
    response.message = email;

    return response;
  }
}
