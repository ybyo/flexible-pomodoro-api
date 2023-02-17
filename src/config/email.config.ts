import { registerAs } from '@nestjs/config';

interface IEmailConfig {
  host: string;
  api_port: number;
  front_port: number;
  auth: {
    user?: string;
    pass?: string;
    sgMailApi?: string;
  };
  service?: string;
  [key: string]: unknown;
}

export default registerAs('email', (): IEmailConfig => {
  const emailConfig: IEmailConfig = {
    host: process.env.BASE_URL,
    api_port: parseInt(process.env.API_PORT, 10),
    front_port: parseInt(process.env.FRONT_PORT, 10),
    auth: {},
  };
  if (process.env.NODE_ENV === 'dev') {
    emailConfig.service = process.env.EMAIL_SERVICE;
    emailConfig.auth.user = process.env.EMAIL_AUTH_USER;
    emailConfig.auth.pass = process.env.EMAIL_AUTH_PASSWORD;
  } else if (process.env.NODE_ENV === 'prod') {
    emailConfig.auth.sgMailApi = process.env.SENDGRID_API_KEY;
  }
  return emailConfig;
});
