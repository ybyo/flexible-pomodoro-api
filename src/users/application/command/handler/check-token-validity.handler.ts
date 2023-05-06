import { BadRequestException, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CheckTokenValidityQry } from '@/users/application/command/impl/check-token-validity.qry';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { User } from '@/users/domain/user.model';

@QueryHandler(CheckTokenValidityQry)
export class CheckTokenValidityHandler
  implements IQueryHandler<CheckTokenValidityQry>
{
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute(qry: CheckTokenValidityQry): Promise<User | null> {
    const { column, token } = qry;
    const user = await this.userRepository.findByToken(column, token);

    if (user) return user;

    throw new BadRequestException('Invalid token');
  }
}
