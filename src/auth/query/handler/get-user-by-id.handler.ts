import { BadRequestException, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetUserByIdQry }  from '@/auth/query/impl/get-user-by-id.qry';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { User } from '@/users/domain/user.model';

@QueryHandler(GetUserByIdQry)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQry> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserByIdQry): Promise<User | Error> {
    const { id } = query;
    const user = await this.userRepository.findById(id);

    if (user !== null) return user;

    return new BadRequestException('Cannot find user with user id');
  }
}
