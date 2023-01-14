import { registerAs } from '@nestjs/config';
import { CookieOptions } from 'express';

export default registerAs<CookieOptions>('refreshToken', () => ({
  maxAge: parseInt(process.env.REFRESH_TOKEN_LIFETIME) * 60 * 1000,
  httpOnly: true,
  secure: false,
  sameSite: 'none',
}));
