import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';

import { REDIS_AUTH } from '@/redis/redis.constants';

@Injectable()
export class RedisAuthService {
  constructor(@Inject(REDIS_AUTH) private redisClient: Redis) {}

  async checkLoggedIn(req: Request): Promise<string> {
    const refreshToken = req.cookies['refreshToken']
      .split(':')[1]
      .split('.')[0];
    const sessionString = await this.redisClient.get(`sess:${refreshToken}`);
    const sessionObject = JSON.parse(sessionString);

    return sessionObject.hasOwnProperty('passport')
      ? sessionObject.passport.user
      : false;
  }
}
