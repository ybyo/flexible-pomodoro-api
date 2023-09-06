import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_TIMER_SOCKET } from '@/redis/redis.constants';

@Injectable()
export class RedisTimerSocketService {
  constructor(@Inject(REDIS_TIMER_SOCKET) private redisClient: Redis) {}

  async setUserLoggedIn(id: string) {
    this.redisClient.hset(`user:${id}`, 'status');
  }

  async getUserStatus(token: string) {
    this.redisClient.hget('token', 'status', (err, result) => {
      console.log(err);
    });
  }
}
