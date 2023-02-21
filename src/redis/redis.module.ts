import { Module } from '@nestjs/common';
import * as Redis from 'redis';

import { REDIS } from './redis.constants';

// 'redis://username:password@your.redis.url'
const url = `redis://${process.env.REDIS_URL}`;

@Module({
  providers: [
    {
      provide: REDIS,
      // useValue: Redis.createClient({ url, legacyMode: true }),
      useFactory: async () => {
        const client = Redis.createClient({
          url: url,
        });
        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}

