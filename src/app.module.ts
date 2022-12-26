import { validationSchema } from './config/validationSchema';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { Module } from '@nestjs/common';
import { LoggingModule } from './logging/logging.module';
import { HttpModule } from '@nestjs/axios';
import { HealthCheckController } from './health-check/health-check.controller';
import { ExceptionModule } from './exception/exception-module';
import { ConfigModule } from '@nestjs/config';
import emailConfig from './config/emailConfig';
import authConfig from './config/authConfig';
import * as path from 'path';

const envPath = path.join(process.cwd(), `env/.${process.env.NODE_ENV}.env`);

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      envFilePath: [envPath],
      load: [emailConfig, authConfig],
      isGlobal: true,
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
    LoggingModule,
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthCheckController],
  providers: [],
})
export class AppModule {}
