import { GetUserInfoQuery } from './get-user-info.query';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUser } from '@/typeDefs/message.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../../infra/db/entity/user.entity';

@QueryHandler(GetUserInfoQuery)
export class GetUserInfoQueryHandler
  implements IQueryHandler<GetUserInfoQuery>
{
  // TODO: usersRepository, 의존성 문제 해결
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async execute(query: GetUserInfoQuery): Promise<IUser> {
    const { userId } = query;

    const user = await this.usersRepository.findOneBy({ uid: userId });

    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다');
    }

    return {
      uid: user.uid,
      userName: user.userName,
      email: user.email,
    };
  }
}
