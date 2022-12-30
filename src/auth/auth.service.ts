import * as jwt from 'jsonwebtoken';
import authConfig, { jwtOptions } from 'src/config/authConfig';
import cookieConfig from '@/config/cookieConfig';
import { ConfigType } from '@nestjs/config';
import { IUser } from '@/typeDefs/message.interface';
import { Inject, Injectable, Res } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @Inject(authConfig.KEY) private auth: ConfigType<typeof authConfig>,
    @Inject(cookieConfig.KEY) private cookie: ConfigType<typeof cookieConfig>,
  ) {}

  issueToken(user: IUser) {
    // TODO: 유저 uuid 엔티티 이름 변경, uuid 생성 방법 변경
    return jwt.sign(user, this.auth.jwtSecret, jwtOptions);
  }

  verify(jwtString: string) {
    try {
      const payload = jwt.verify(jwtString, this.auth.jwtSecret) as (
        | jwt.JwtPayload
        | string
      ) &
        IUser;

      const user = {
        uid: payload.uid,
        userName: payload.userName,
        email: payload.email,
      };

      return {
        success: true,
        data: user,
      };
    } catch (err) {
      const payload = jwt.decode(jwtString) as (jwt.JwtPayload | string) &
        IUser;

      const user = {
        uid: payload.uid,
        userName: payload.userName,
        email: payload.email,
      };

      return {
        success: false,
        status: 401,
        message: err.message,
        data: user,
      };
    }
  }

  issueCookie(user: IUser, @Res({ passthrough: true }) res: Response) {
    const loginResult = {
      status: 'success',
      userPayload: user,
    };

    const accessToken = this.issueToken(user);

    return res
      .cookie('accessToken', accessToken, this.cookie)
      .status(200)
      .json(loginResult);
  }

  logout(@Res({ passthrough: true }) res: Response) {
    return res.cookie('accessToken', '', { ...this.cookie, maxAge: 1 });
  }
}
