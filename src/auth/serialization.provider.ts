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
      user: { userId: string; userName: string; email: string },
    ) => void,
  ) {
    done(null, {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
    });
  }

  async deserializeUser(
    payload: { userId: string; userName: string; email: string },
    done: (err: Error, user: Omit<IUser, 'password'>) => void,
  ) {
    const user = await this.authService.findByUserId(payload.userId);
    done(null, user);
  }
}
