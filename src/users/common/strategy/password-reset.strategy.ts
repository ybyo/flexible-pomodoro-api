import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '@/auth/auth.service';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '@/type-defs/message.interface';

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['resetPasswordToken'];
  }
  return token;
};

export class PasswordResetStrategy extends PassportStrategy(Strategy) {
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
