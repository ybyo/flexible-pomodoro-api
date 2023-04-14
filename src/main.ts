import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import helmet from 'helmet';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as path from 'path';
import * as winston from 'winston';

import { AppModule } from './app.module';

const certPath = path.join(__dirname, '..', 'certs');

const httpsOptions =
  process.env.NODE_ENV === 'development'
    ? {
        key: fs.readFileSync(`${certPath}/dev-key.pem`),
        cert: fs.readFileSync(`${certPath}/dev-cert.pem`),
      }
    : {
        key: fs.readFileSync(`${certPath}/key.pem`),
        cert: fs.readFileSync(`${certPath}/cert.pem`),
      };

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'staging' ? 'info' : 'silly',
          format: winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike(process.env.NODE_ENV, {
              prettyPrint: true,
              colors: true,
            }),
          ),
        }),
      ],
    }),
    httpsOptions,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const corsOption = {
    origin: [
      process.env.NODE_ENV === 'development'
        ? 'https://127.0.0.1:4000'
        : `https://${process.env.DOMAIN_URL}:4000`,
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  };

  app.useStaticAssets(path.join(__dirname, '..', 'public'));
  app.setBaseViewsDir(path.join(__dirname, '..', 'views'));

  app.setViewEngine('ejs');
  app.use(cookieParser());
  app.enableCors(corsOption);
  app.use(helmet());

  await app.listen(3000);
}

bootstrap();
