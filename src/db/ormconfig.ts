import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.join(
    process.cwd(),
    'env',
    process.env.NODE_ENV === 'prod'
      ? '.prod.env'
      : process.env.NODE_ENV === 'stage'
      ? '.stage.env'
      : '.dev.env',
  ),
});

const ormConfig = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: Boolean(process.env.DATABASE_SYNCHRONIZE),
  migrations: ['dist/migration/*{.ts,.js}'],
});

export default ormConfig;

