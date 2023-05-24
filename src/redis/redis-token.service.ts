import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import Redis from 'ioredis';

import { REDIS_TOKEN } from '@/redis/redis.constants';

@Injectable()
export class RedisTokenService {
  constructor(
    private commandBus: CommandBus,
    @Inject(REDIS_TOKEN) private redisClient: Redis,
  ) {}

  async setPXAT(key: string, value: string, expiredAt?: number): Promise<'OK'> {
    return this.redisClient.set(key, value, 'PXAT', expiredAt);
  }

  async getPexpiretime(key: string): Promise<number> {
    return this.redisClient.pexpiretime(key);
  }

  async getValue(key: string): Promise<string> {
    return this.redisClient.get(key);
  }

  async deleteValue(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async getClient(): Promise<Redis> {
    return this.redisClient;
  }
}
