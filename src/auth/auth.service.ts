import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { ulid } from 'ulid';

import { CheckEmailDupCmd } from '@/auth/command/impl/check-email-dup.cmd';
import { ValidateUserCommand } from '@/auth/command/impl/validate-user.command';
import { GetUserByUserIdQuery } from '@/auth/query/impl/get-user-by-userid.query';
import accessTokenConfig from '@/config/accessTokenConfig';
import jwtConfig, { jwtExpConfig } from '@/config/jwtConfig';
import { IUser } from '@/customTypes/interfaces/message.interface';
import { REDIS } from '@/redis';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { CheckEmailDto } from '@/users/interface/dto/check-email.dto';
import { LoginUserDto } from '@/users/interface/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY) private jwtConf: ConfigType<typeof jwtConfig>,
    @Inject(accessTokenConfig.KEY)
    private accessTokenConf: ConfigType<typeof accessTokenConfig>,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    @Inject(REDIS) private readonly redisClient: Redis,
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  // Interact with passport local strategy
  async validateWithIdPw(user: LoginUserDto) {
    const { email, password } = user;
    const command = new ValidateUserCommand(email, password);

    return await this.commandBus.execute(command);
  }

  async findByUserId(id: string) {
    const command = new GetUserByUserIdQuery(id);

    return await this.queryBus.execute(command);
  }

  async verifyJWT(jwtString: string) {
    let payload = null;
    const user = {} as IUser;
    try {
      payload = jwt.verify(
        jwtString,
        this.jwtConf.jwtSecret,
      ) as jwt.JwtPayload & IUser;

      user.id = payload.id;
      user.userName = payload.userName;
      user.email = payload.email;

      return {
        success: true,
        data: user,
      };
    } catch (err) {
      payload = jwt.decode(jwtString) as (jwt.JwtPayload | string) & IUser;

      user.id = payload.id;
      user.userName = payload.userName;
      user.email = payload.email;

      return {
        success: false,
        status: 401,
        message: err.message,
        data: user,
      };
    }
  }

  async issueJWT(user: IUser): Promise<string> {
    return jwt.sign(user, this.jwtConf.jwtSecret, jwtExpConfig);
  }

  async checkEmail(dto: CheckEmailDto) {
    const { email } = dto;
    const command = new CheckEmailDupCmd(email);

    return await this.commandBus.execute(command);
  }

  async issueUlid(): Promise<string> {
    return ulid();
  }
}
