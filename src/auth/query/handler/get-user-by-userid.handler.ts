import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GetUserByUserIdQuery } from '@/auth/query/impl/get-user-by-userid.query';
import { UserEntity } from '@/users/infra/db/entity/user.entity';

@QueryHandler(GetUserByUserIdQuery)
export class GetUserByUserIdHandler
  implements IQueryHandler<GetUserByUserIdQuery>
{
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async execute(query: GetUserByUserIdQuery): Promise<UserEntity> {
    const { id } = query;
    return await this.usersRepository.findOneBy({ id });
  }
}
