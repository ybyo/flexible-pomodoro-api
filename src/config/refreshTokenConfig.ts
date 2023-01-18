import { registerAs } from '@nestjs/config';
import { CookieOptions } from 'express';

export default registerAs<CookieOptions>('refreshToken', () => ({
  maxAge: 60 * 60 * 24 * parseInt(process.env.REFRESH_TOKEN_LIFETIME),
  httpOnly: true,
  secure: true,
  sameSite: 'none',
}));
