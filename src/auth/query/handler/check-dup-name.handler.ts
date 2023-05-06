import { BadRequestException, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CheckDupNameQry } from '@/auth/query/impl/check-dup-name.qry';
import { IRes } from '@/customTypes/interfaces/message.interface';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@QueryHandler(CheckDupNameQry)
export class CheckDupNameHandler implements IQueryHandler<CheckDupNameQry> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(query: CheckDupNameQry): Promise<IRes | null> {
    const { username } = query;
    const user = await this.userRepository.findByUsername(username);

    if (!user) return { success: true };

    throw new BadRequestException('Duplicate username');
  }
}
