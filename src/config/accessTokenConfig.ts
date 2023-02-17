import { registerAs } from '@nestjs/config';
import { CookieOptions } from 'express';

export default registerAs<CookieOptions>('accessToken', () => ({
  maxAge: parseInt(process.env.ACCESS_TOKEN_LIFETIME) * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
  sameSite: 'none',
}));
