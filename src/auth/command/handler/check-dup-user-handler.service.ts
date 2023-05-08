import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, IQueryHandler } from '@nestjs/cqrs';

import { CheckDupUserQry } from '@/auth/command/impl/check-dup-user.qry';
import { IRes } from '@/customTypes/interfaces/message.interface';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(CheckDupUserQry)
export class CheckDupUserHandler implements IQueryHandler<CheckDupUserQry> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: CheckDupUserQry): Promise<IRes<string>> {
    const { email, userName } = command;

    const dupEmailUser = await this.userRepository.findByEmail(email);
    if (dupEmailUser !== null) {
      throw new BadRequestException('Duplicate email');
    }

    const dupNameUser = await this.userRepository.findByUsername(userName);
    if (dupNameUser !== null) {
      throw new BadRequestException('Duplicate username');
    }

    return { success: true };
  }
}
