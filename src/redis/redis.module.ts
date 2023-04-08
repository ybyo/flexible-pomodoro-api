import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as Redis from 'redis';

import { REDIS } from './redis.constants';

dotenv.config({
  path: path.join(__dirname, `../../env/.${process.env.NODE_ENV}.env`),
});

const url = `redis://${process.env.REDIS_URL}`;

@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: async () => {
        const client = Redis.createClient({
          url: url,
          legacyMode: true,
        });
        await client.connect();
        client.on('error', (err) => {
          console.error(err);
        });
        return client;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
