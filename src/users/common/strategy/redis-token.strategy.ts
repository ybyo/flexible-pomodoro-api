import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';

import { RedisService } from '@/redis/redis.service';

@Injectable()
export class RedisTokenStrategy extends PassportStrategy(
  Strategy,
  'redis-token',
) {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async validate(req: Request): Promise<boolean> {
    const token = 'query' in req ? req.query['signupVerifyToken'] : null;
    const savedToken = await this.redisService.getValue(`verifyEmail:${token}`);

    return savedToken === '1';
  }
}
