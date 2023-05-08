import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import Redis from 'ioredis';

import { REDIS } from '@/redis/redis.constants';

@Injectable()
export class RedisTokenService {
  constructor(
    private commandBus: CommandBus,
    @Inject(REDIS) private redisClient: Redis,
  ) {}

  async setValue(key: string, value: string, duration?: number): Promise<void> {
    if (duration !== undefined) {
      await this.redisClient.set(key, value, 'EX', duration);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async getValue(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async deleteValue(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async getClient(): Promise<Redis> {
    return this.redisClient;
  }
}
