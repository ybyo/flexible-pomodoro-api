import { AuthService } from '@/auth/auth.service';
import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { IUser } from '@/type-defs/message.interface';

@Injectable()
export class AuthSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }
  serializeUser(
    user: IUser,
    done: (
      err: Error,
      user: { id: string; userName: string; email: string },
    ) => void,
  ) {
    done(null, {
      id: user.id,
      userName: user.userName,
      email: user.email,
    });
  }

  async deserializeUser(
    payload: { id: string; userName: string; email: string },
    done: (err: Error, user: Omit<IUser, 'password'>) => void,
  ) {
    const user = await this.authService.findByUserId(payload.id);
    done(null, user);
  }
}
