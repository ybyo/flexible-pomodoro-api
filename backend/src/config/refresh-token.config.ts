import { registerAs } from '@nestjs/config';
import { CookieOptions } from 'express';

export default registerAs<CookieOptions>('refreshToken', () => ({
  maxAge: +process.env.REFRESH_LIFETIME * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  domain:
    process.env.NODE_ENV === 'development' ? '127.0.0.1' : 'pipetimer.com',
  path: '/',
}));