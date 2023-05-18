import { registerAs } from '@nestjs/config';

interface IEmailConfig {
  host: string;
  api_port: number;
  front_port: number;
  auth: {
    sgMailKey?: string;
    testService: string;
    testUser: string;
    testPassword: string;
  };
}

export default registerAs('email', (): IEmailConfig => {
  const emailConfig: IEmailConfig = {
    host: process.env.FRONT_URL || '127.0.0.1',
    api_port: +process.env.API_PORT || 3000,
    front_port: +process.env.FRONT_PORT || 4000,
    auth: {
      sgMailKey: process.env.SENDGRID_API,
      testService: process.env.EMAIL_SERVICE,
      testUser: process.env.EMAIL_AUTH_USER,
      testPassword: process.env.EMAIL_AUTH_PASSWORD,
    },
  };

  return emailConfig;
});
