import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import * as path from 'path';

import { RedisTokenService } from '@/redis/redis-token.service';
import { RedisTokenListeningService } from '@/redis/redis-token-listening.service';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { DeleteAccountHandler } from '@/users/application/command/handler/delete-account.handler';
import { UserFactory } from '@/users/domain/user.factory';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserRepository } from '@/users/infra/db/repository/user.repository';

import { REDIS } from './redis.constants';

dotenv.config({
  path: path.join(process.cwd(), `env/.${process.env.NODE_ENV}.env`),
});

const repositories = [{ provide: 'UserRepository', useClass: UserRepository }];
const commandHandlers = [DeleteAccountHandler];
const factories = [UserFactory];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity, RoutineEntity, RoutineToTimerEntity]),
  ],
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
    RedisTokenService,
    RedisTokenListeningService,
    Logger,
    ...commandHandlers,
    ...repositories,
    ...factories,
  ],
  exports: [REDIS, RedisTokenService],
})
export class RedisModule {}
