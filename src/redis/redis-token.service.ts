import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import Redis from 'ioredis';

import { REDIS } from '@/redis/redis.constants';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
export class RedisTokenService {
  constructor(
    private commandBus: CommandBus,
    @Inject(REDIS) private redisClient: Redis,
    @Inject('UserRepository') private userRepository: IUserRepository,
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

  async getEventToken(req) {
    const raw = req.query;
    if (raw === null) throw new BadRequestException(`Invalid request`);

    const event = Object.keys(raw)[0] as string;
    const token = Object.values(raw)[0] as string;

    return { event, token };
  }

  async getClient(): Promise<Redis> {
    return this.redisClient;
  }
}
