import { Module } from '@nestjs/common';
import * as path from 'path';
import * as Redis from 'redis';
import * as dotenv from 'dotenv';

import { REDIS } from './redis.constants';

dotenv.config({
  path: path.join(__dirname, `../../env/.${process.env.NODE_ENV}.env`),
});
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
