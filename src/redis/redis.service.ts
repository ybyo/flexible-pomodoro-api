import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS } from '@/redis/redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS) private readonly redisClient: Redis) {}

  async setValue(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async getValue(key: string): Promise<string> {
    return this.redisClient.get(key);
  }
}
