import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
}));

export const jwtOptions = {
  expiresIn: '60s',
};
