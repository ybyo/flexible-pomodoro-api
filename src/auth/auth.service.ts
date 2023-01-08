import * as jwt from 'jsonwebtoken';
import jwtConfig, { jwtExpConfig } from '@/config/jwtConfig';
import accessTokenConfig from '@/config/accessTokenConfig';
import { ConfigType } from '@nestjs/config';
import { IUser } from '@/type-defs/message.interface';
import { BadRequestException, Inject, Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import { LoginUserDto } from '@/users/interface/dto/login-user.dto';
import { ValidateUserCommand } from '@/auth/command/impl/validate-user.command';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetUserByUserIdQuery } from '@/auth/query/impl/get-user-by-userid.query';
import { RegisterUserCommand } from '@/auth/command/impl/register-user.command';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY) private jwtConf: ConfigType<typeof jwtConfig>,
    @Inject(accessTokenConfig.KEY)
    private accessTokenConf: ConfigType<typeof accessTokenConfig>,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  // Interact with passport local strategy
  async validateUser(user: LoginUserDto) {
    // login command
    const { email, password } = user;
    // TODO: 에러 핸들링 auth service에서 수행하도록 구현
    const command = new ValidateUserCommand(email, password);
    const foundUser = await this.commandBus.execute(command);
    // if (!users || !(await verifyPassword(foundUser.password, users.password))) {
    //   throw new UnauthorizedException('Incorrect username or password');
    // }

    return foundUser;
  }

  async logoutUser(@Res({ passthrough: true }) res: Response) {
    return res.cookie('accessToken', '', { ...this.accessTokenConf, maxAge: 1 });
  }

  async findByUserId(userId: string) {
    const command = new GetUserByUserIdQuery(userId);
    const user = await this.queryBus.execute(command);

    if (!user) {
      throw new BadRequestException(`No user found with id ${userId}`);
    }
    return user;
  }

  async registerUser(user): Promise<IUser> {
    const { userName, email, password } = user;
    const command = new RegisterUserCommand(userName, email, password);

    return await this.commandBus.execute(command);

    // TODO: Confirmation Password 검증절차 서버에서 수행
    // if (users.password !== users.confirmationPassword) {
    //   throw new BadRequestException(
    //     'Password and Confirmation Password must match',
    //   );
    // }
    // const { confirmationPassword: _, ...newUser } = users;
  }

  async verify(jwtString: string) {
    try {
      const payload = jwt.verify(jwtString, this.jwtConf.jwtSecret) as (
        | jwt.JwtPayload
        | string
      ) &
        IUser;

      const user = {
        userId: payload.userId,
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
        userId: payload.userId,
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

  async issueToken(user: IUser) {
    // TODO: 유저 uuid 엔티티 이름 변경, uuid 생성 방법 변경
    return jwt.sign(user, this.jwtConf.jwtSecret, jwtExpConfig);
  }
}
