import * as RedisStore from 'connect-redis';
import * as path from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import authConfig from './config/authConfig';
import cookieConfig from '@/config/cookieConfig';
import emailConfig from './config/emailConfig';
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
import { UsersModule } from './users/users.module';
import { classes } from '@automapper/classes';
import { validationSchema } from './config/validationSchema';

const envPath = path.join(process.cwd(), `env/.${process.env.NODE_ENV}.env`);

@Module({
  imports: [
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    ConfigModule.forRoot({
      envFilePath: [envPath],
      load: [authConfig, cookieConfig, emailConfig],
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
    UsersModule,
    AuthModule,
    RedisModule,
    HttpModule,
    LoggingModule,
    TerminusModule,
    ExceptionModule,
  ],
  controllers: [HealthCheckController],
  providers: [],
})
export class AppModule implements NestModule {
  constructor(
    @Inject(REDIS) private readonly redis: RedisClient,
    @Inject(cookieConfig.KEY) private cookie: ConfigType<typeof cookieConfig>,
  ) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        session({
          store: new (RedisStore(session))({
            client: this.redis,
            logErrors: true,
          }),
          saveUninitialized: false,
          secret: process.env.SESSION_SECRET,
          resave: false,
          cookie: this.cookie,
        }),
        // `initialize()` must be called before `session()`
        passport.initialize(),
        passport.session(),
      )
      .forRoutes('*');
  }
}
