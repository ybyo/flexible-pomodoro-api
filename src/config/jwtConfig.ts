import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  jwtSecret: process.env.JWT_SECRET,
}));

export const jwtExpConfig = {
  expiresIn: '1d',
};
