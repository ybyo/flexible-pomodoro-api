import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '@/auth/auth.service';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '@/customTypes/interfaces/message.interface';

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['accessToken'];
  }
  return token;
};

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      authService: AuthService,
    });
  }

  async validate(payload: JwtPayload & IUser) {
    return payload;
  }
}
