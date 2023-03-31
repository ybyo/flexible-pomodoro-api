import { GetUserByUserIdQuery } from '@/auth/query/impl/get-user-by-userid.query';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUser } from '@/type-defs/message.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';

@QueryHandler(GetUserByUserIdQuery)
export class GetUserByUserIdHandler
  implements IQueryHandler<GetUserByUserIdQuery>
{
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async execute(query: GetUserByUserIdQuery): Promise<IUser> {
    const { id } = query;

    const user = await this.usersRepository.findOneBy({ id: id });

    if (!user) {
      return {
        id: null,
        userName: null,
        email: null,
      };
    }

    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
    };
  }
}
