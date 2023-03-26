import { registerAs } from '@nestjs/config';

interface IEmailConfig {
  host: string;
  api_port: number;
  front_port: number;
  auth: {
    sgMailApi: string;
  };
  [key: string]: unknown;
}

export default registerAs('email', (): IEmailConfig => {
  const emailConfig: IEmailConfig = {
    host: process.env.FRONT_URL,
    api_port: parseInt(process.env.API_PORT, 10),
    front_port: parseInt(process.env.FRONT_PORT, 10),
    auth: {
      sgMailApi: process.env.SENDGRID_API,
    },
  };
  return emailConfig;
});
