import { HttpModule } from '@nestjs/axios';
import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as RedisStore from 'connect-redis';
import * as session from 'express-session';
import { RedisClient } from 'ioredis/built/connectors/SentinelConnector/types';
import * as passport from 'passport';
import * as path from 'path';

import { AuthModule } from '@/auth/auth.module';
import accessTokenConfig from '@/config/access-token.config';
import emailConfig from '@/config/email.config';
import refreshTokenConfig from '@/config/refresh-token.config';
import { validationSchema } from '@/config/validation.schema';
import { ormConfig, ormTestConfig } from '@/db/orm.config';
import { ExceptionModule } from '@/exception/exception-module';
import { HealthCheckController } from '@/health-check/health-check.controller';
import { LoggingModule } from '@/logging/logging.module';
import { REDIS_AUTH } from '@/redis/redis.constants';
import { RedisModule } from '@/redis/redis.module';
import { RoutineModule } from '@/routines/routine.module';
import { TimerModule } from '@/timers/timer.module';
import { UserModule } from '@/users/user.module';
import { TimerGateway } from '@/ws/timer.gateway';

import jwtConfig from './config/jwt.config';

const envPath = path.join(
  __dirname,
  '../../env',
  process.env.NODE_ENV === 'development'
    ? '.development.env'
    : process.env.NODE_ENV === 'local-staging'
    ? '.local-staging.env'
    : process.env.NODE_ENV === 'staging'
    ? '.staging.env'
    : '.production.env'
);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: [envPath],
      load: [jwtConfig, refreshTokenConfig, accessTokenConfig, emailConfig],
      isGlobal: true,
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({}),
      dataSourceFactory: () =>
        process.env.TEST === 'true'
          ? ormTestConfig.initialize()
          : ormConfig.initialize(),
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 20,
    }),
    UserModule,
    AuthModule,
    RedisModule,
    HttpModule,
    LoggingModule,
    TerminusModule,
    ExceptionModule,
    TimerModule,
    RoutineModule,
  ],
  controllers: [HealthCheckController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    TimerGateway,
  ],
})
export class AppModule implements NestModule {
  constructor(
    @Inject(REDIS_AUTH) private redisClient: RedisClient,
    @Inject(refreshTokenConfig.KEY)
    private refreshTokenConf: ConfigType<typeof refreshTokenConfig>
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        session({
          store: new (RedisStore(session))({
            client: this.redisClient,
            logErrors: true,
          }),
          name: 'refreshToken',
          saveUninitialized: false,
          resave: false,
          secret: process.env.SESSION_SECRET,
          cookie: this.refreshTokenConf,
        }),
        passport.initialize(),
        passport.session()
      )
      .forRoutes('*');
  }
}
