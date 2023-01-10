import { Injectable } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

// Local strategy for login.
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      // usernameField(default) as email
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string) {
    return this.authService.validateWithIdPw({ email, password });
  }
}
