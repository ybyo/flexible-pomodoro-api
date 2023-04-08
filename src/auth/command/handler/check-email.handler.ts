import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CheckEmailCommand } from '@/auth/command/impl/check-email.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { IRes } from '@/customTypes/interfaces/message.interface';

@Injectable()
@CommandHandler(CheckEmailCommand)
export class CheckEmailHandler implements ICommandHandler<CheckEmailCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: CheckEmailCommand) {
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
