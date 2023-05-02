import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IUser } from '@/customTypes/interfaces/message.interface';
import { CheckTokenValidityQuery } from '@/users/application/command/impl/check-token-validity.query';
import { UserEntity } from '@/users/infra/db/entity/user.entity';

@QueryHandler(CheckTokenValidityQuery)
export class CheckTokenValidityHandler
  implements IQueryHandler<CheckTokenValidityQuery>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(query: CheckTokenValidityQuery): Promise<IUser | null> {
    const { field, token } = query;

    return await this.userRepository.findOneBy({ [field]: token });
  }
}
