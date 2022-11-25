import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: 'test',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: Boolean(process.env.DATABASE_SYNCHRONIZE),
});

export default dataSource;
