import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CheckSignupTokenValidityQuery } from '@/users/application/query/impl/check-signup-token-validity.query';
import { IUserRepository } from '@/users/domain/iuser.repository';
import { UserWithoutPassword } from '@/users/domain/user.model';

@QueryHandler(CheckSignupTokenValidityQuery)
export class CheckSignupTokenValidityHandler
  implements IQueryHandler<CheckSignupTokenValidityQuery>
{
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute(
    query: CheckSignupTokenValidityQuery,
  ): Promise<UserWithoutPassword | null> {
    return await this.userRepository.findBySignupToken(query.token);
  }
}
