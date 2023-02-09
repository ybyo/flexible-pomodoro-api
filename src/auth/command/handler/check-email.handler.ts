import {
  BadRequestException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CheckEmailCommand } from '@/auth/command/impl/check-email.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { IRes } from '@/type-defs/message.interface';
import { OmitType } from '@nestjs/mapped-types';
import { User } from '@/users/domain/user.model';

@Injectable()
@CommandHandler(CheckEmailCommand)
export class CheckEmailHandler implements ICommandHandler<CheckEmailCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: CheckEmailCommand) {
    const { email } = command;

    const user = await this.userRepository.findByEmail(email);

    if (user !== null) {
      throw new BadRequestException('Duplicate email');
    }

    const response = {} as IRes<any>;
    response.success = true;
    response.message = 'Unique email';

    return response;
  }
}
