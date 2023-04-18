import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import * as path from 'path';

import { RedisService } from '@/redis/redis.service';

import { REDIS } from './redis.constants';

dotenv.config({
  path: path.join(process.cwd(), `env/.${process.env.NODE_ENV}.env`),
});

const url = `redis://${process.env.REDIS_URL}`;

@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: async (): Promise<Redis> => {
        const client = await new Redis({
          port: +process.env.REDIS_PORT,
          host: process.env.REDIS_URL,
        });
        client.on('error', (err) => {
          console.error(err);
        });
        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS, RedisService],
})
export class RedisModule {}
