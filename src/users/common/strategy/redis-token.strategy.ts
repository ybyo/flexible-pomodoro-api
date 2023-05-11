import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { AuthService } from '@/auth/auth.service';
import { RedisTokenService } from '@/redis/redis-token.service';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
export class RedisTokenStrategy extends PassportStrategy(
  Strategy,
  'redis-token',
) {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
    private redisService: RedisTokenService,
  ) {
    super();
  }

  async validate(req: Request): Promise<boolean> {
    const { event, token } = await this.authService.splitEventToken(req);

    const isValid = await this.redisService.getValue(`${event}:${token}`);
    if (!!isValid) return true;

    throw new BadRequestException('Invalid token');
  }
}
