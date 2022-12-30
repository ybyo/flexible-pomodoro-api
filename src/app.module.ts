import * as path from 'path';
import authConfig from './config/authConfig';
import cookieConfig from '@/config/cookieConfig';
import emailConfig from './config/emailConfig';
import { ConfigModule } from '@nestjs/config';
import { ExceptionModule } from './exception/exception-module';
import { HealthCheckController } from './health-check/health-check.controller';
import { HttpModule } from '@nestjs/axios';
import { LoggingModule } from './logging/logging.module';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { validationSchema } from './config/validationSchema';

const envPath = path.join(process.cwd(), `env/.${process.env.NODE_ENV}.env`);

@Module({
  imports: [
    UsersModule,
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
    ExceptionModule,
    HttpModule,
    LoggingModule,
    TerminusModule,
  ],
  controllers: [HealthCheckController],
  providers: [],
})
export class AppModule {}
