import { HttpException, HttpStatus } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CheckDuplicateUsernameQuery } from '@/auth/query/impl/check-duplicate-username.query';
import { IUser } from '@/customTypes/interfaces/message.interface';
import { UserEntity } from '@/users/infra/db/entity/user.entity';

@QueryHandler(CheckDuplicateUsernameQuery)
export class CheckDuplicateUsernameHandler
  implements IQueryHandler<CheckDuplicateUsernameQuery>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async execute(query: CheckDuplicateUsernameQuery): Promise<IUser | null> {
    const { username } = query;
    let user = {} as IUser;

    try {
      user = await this.usersRepository.findOneBy({ userName: username });
    } catch (err) {
      throw new HttpException(
        'Unable to perform the query.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return user === null
      ? null
      : { id: user.id, userName: user.userName, email: user.email };
  }
}
