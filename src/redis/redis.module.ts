import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import * as path from 'path';

import { EmailModule } from '@/email/email.module';
import { RedisTokenService } from '@/redis/redis-token.service';
import { RedisTokenSubsService } from '@/redis/redis-token-subs.service';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { DeleteAccountHandler } from '@/users/application/command/handlers/delete-account.handler';
import { UserFactory } from '@/users/domain/user.factory';
import { EmailService } from '@/users/infra/adapter/email.service';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserRepository } from '@/users/infra/db/repository/user.repository';

import { REDIS_AUTH, REDIS_SUB, REDIS_TOKEN } from './redis.constants';

dotenv.config({
  path: path.join(process.cwd(), `env/.${process.env.NODE_ENV}.env`),
});

const externalService = [{ provide: 'EmailService', useClass: EmailService }];

const repositories = [{ provide: 'UserRepository', useClass: UserRepository }];
const commandHandlers = [DeleteAccountHandler];
const factories = [UserFactory];

async function createRedisClient(): Promise<Redis> {
  const client = await new Redis({
    port: +process.env.REDIS_PORT,
    host: process.env.REDIS_URL,
  });
  client.on('error', (err) => {
    console.error(err);
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
    RedisTokenSubsService,
  ],
  exports: [
    REDIS_AUTH,
    REDIS_TOKEN,
    REDIS_SUB,
    RedisTokenService,
    RedisTokenSubsService,
  ],
})
export class RedisModule {}
