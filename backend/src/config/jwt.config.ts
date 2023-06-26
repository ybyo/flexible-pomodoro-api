import { registerAs } from '@nestjs/config';
import { JwtSecretRequestType } from '@nestjs/jwt';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRESIN,
}));
