import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS } from '@/redis/redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS) private readonly redisClient: Redis) {}

  async setValue(key: string, value: string, duration?: number): Promise<void> {
    if (duration !== undefined) {
      await this.redisClient.set(key, value, 'EX', duration);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async getValue(key: string): Promise<any> {
    return this.redisClient.get(key);
  }

  async deleteValue(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async getClient(): Promise<Redis> {
    return this.redisClient;
  }
}
