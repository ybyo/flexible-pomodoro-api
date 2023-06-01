import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import * as path from 'path';

import { EmailModule }             from '@/email/email.module';
import { RedisTokenService }       from '@/redis/redis-token.service';
import { RedisTokenPubSubService } from '@/redis/redis-token-pub-sub.service';
import { RoutineEntity }           from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity }    from '@/routines/infra/db/entity/routine-to-timer.entity';
import { DeleteUserHandler }       from '@/users/application/command/handlers/delete-user.handler';
import { UserFactory }             from '@/users/domain/user.factory';
import { EmailService }            from '@/users/infra/adapter/email.service';
import { UserEntity }              from '@/users/infra/db/entity/user.entity';
import { UserRepository }          from '@/users/infra/db/repository/user.repository';

import { REDIS_AUTH, REDIS_SUB, REDIS_TOKEN } from './redis.constants';

dotenv.config({
  path: path.join(process.cwd(), `env/.${process.env.NODE_ENV}.env`),
});

const externalService = [{ provide: 'EmailService', useClass: EmailService }];

const repositories = [{ provide: 'UserRepository', useClass: UserRepository }];
const commandHandlers = [DeleteUserHandler];
const factories = [UserFactory];

async function createRedisClient(): Promise<Redis> {
  const client = await new Redis({
    host: process.env.REDIS_URL,
    port:
      process.env.TEST === 'true'
        ? +process.env.REDIS_TEST_PORT
        : +process.env.REDIS_PORT,
  });

  return client;
}

@Module({
  imports: [
    CqrsModule,
    EmailModule,
    TypeOrmModule.forFeature([UserEntity, RoutineEntity, RoutineToTimerEntity]),
  ],
  providers: [
    {
      provide: REDIS_AUTH,
      useFactory: createRedisClient,
    },
    {
      provide: REDIS_TOKEN,
      useFactory: createRedisClient,
    },
    {
      provide: REDIS_SUB,
      useFactory: createRedisClient,
    },
    ...commandHandlers,
    ...externalService,
    ...factories,
    ...repositories,
    Logger,
    RedisTokenService,
    RedisTokenPubSubService,
  ],
  exports: [
    REDIS_AUTH,
    REDIS_TOKEN,
    REDIS_SUB,
    RedisTokenService,
    RedisTokenPubSubService,
  ],
})
export class RedisModule {}
