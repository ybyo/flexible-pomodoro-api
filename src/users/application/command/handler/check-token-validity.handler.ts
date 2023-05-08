import { BadRequestException, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CheckTokenValidQry } from '@/users/application/command/impl/check-token-valid.qry';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { User } from '@/users/domain/user.model';

@QueryHandler(CheckTokenValidQry)
export class CheckTokenValidityHandler
  implements IQueryHandler<CheckTokenValidQry>
{
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute(qry: CheckTokenValidQry): Promise<User | null> {
    const { column, token } = qry;
    const user = await this.userRepository.findByToken(column, token);

    if (user) return user;

    throw new BadRequestException('Invalid token');
  }
}
