import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { RedisTokenService } from '@/redis/redis-token.service';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { UserRepository } from '@/users/infra/db/repository/user.repository';

@Injectable()
export class RedisTokenStrategy extends PassportStrategy(
  Strategy,
  'redis-token',
) {
  constructor(
    private readonly redisService: RedisTokenService,
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
  ) {
    super();
  }

  async validate(req: Request): Promise<boolean> {
    const { event, token } = await this.redisService.getEventToken(req);

    const isValid = await this.redisService.getValue(`${event}:${token}`);
    if (!!isValid) return true;

    throw new BadRequestException('Invalid token');
  }
}
