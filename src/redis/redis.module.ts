import { Module } from '@nestjs/common';
import * as Redis from 'redis';

import { REDIS } from './redis.constants';

// 'redis://username:password@your.redis.url'
const url = 'redis://localhost:6379';

@Module({
  providers: [
    {
      provide: REDIS,
      // useValue: Redis.createClient({ url, legacyMode: true }),
      useFactory: async () => {
        const client = Redis.createClient({
          url: url,
          legacyMode: true,
        });
        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
