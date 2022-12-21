import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_AUTH_USER,
    pass: process.env.EMAIL_AUTH_PASSWORD,
  },
  host: process.env.BASE_URL,
  api_port: parseInt(process.env.API_PORT, 10),
  front_port: parseInt(process.env.FRONT_PORT, 10),
}));
