import { GetUserByUserIdQuery } from '@/auth/query/impl/get-user-by-userid.query';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUser } from '@/type-defs/message.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
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
    const { userId } = query;

    const user = await this.usersRepository.findOneBy({ userId: userId });

    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다');
    }

    return {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
    };
  }
}
