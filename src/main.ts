import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as winston from 'winston';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as fs from 'fs';
import helmet from 'helmet';

const httpsOptions = {
  key: fs.readFileSync(path.resolve(__dirname, '../local-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '../local-cert.pem')),
};
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'prod' ? 'info' : 'silly',
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
    origin: ['https://127.0.0.1:4000', 'https://127.0.0.1'],
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
