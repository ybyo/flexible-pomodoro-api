import * as RedisStore from 'connect-redis';
import * as path from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import jwtConfig from './config/jwtConfig';
import refreshTokenConfig from '@/config/refreshTokenConfig';
import { AuthModule } from '@/auth/auth.module';
import { AutomapperModule } from '@automapper/nestjs';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ExceptionModule } from './exception/exception-module';
import { HealthCheckController } from './health-check/health-check.controller';
import { HttpModule } from '@nestjs/axios';
import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggingModule } from './logging/logging.module';
import { REDIS, RedisModule } from '@/redis';
import { RedisClient } from 'ioredis/built/connectors/SentinelConnector/types';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './users/user.module';
import { classes } from '@automapper/classes';
import { validationSchema } from './config/validationSchema';
import { TimerModule } from './timers/timer.module';
import accessTokenConfig from '@/config/accessTokenConfig';
import { RoutineModule } from '@/routines/routine.module';
import { ScheduleModule } from '@nestjs/schedule';
import emailConfig from '@/config/email.config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

const envPath = path.join(process.cwd(), `env/.${process.env.NODE_ENV}.env`);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    ConfigModule.forRoot({
      envFilePath: [envPath],
      load: [jwtConfig, refreshTokenConfig, accessTokenConfig, emailConfig],
      isGlobal: true,
      // TODO: validationSchema 항목 보완
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({}),
      dataSourceFactory: async () => {
        const { default: ormConfig } = await import('./db/ormconfig');
        await ormConfig.initialize();
        return ormConfig;
      },
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
  ],
})
export class AppModule implements NestModule {
  constructor(
    @Inject(REDIS) private readonly redis: RedisClient,
    @Inject(refreshTokenConfig.KEY)
    private refreshTokenConf: ConfigType<typeof refreshTokenConfig>,
  ) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        session({
          store: new (RedisStore(session))({
            client: this.redis,
            logErrors: true,
          }),
          name: 'refreshToken',
          saveUninitialized: false,
          resave: false,
          secret: process.env.SESSION_SECRET,
          cookie: this.refreshTokenConf,
        }),
        // `initialize()` must be called before `session()`
        passport.initialize(),
        passport.session(),
      )
      .forRoutes('*');
  }
}
