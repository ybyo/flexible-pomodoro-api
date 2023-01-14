// TODO: nest 공식 지원 모듈로 변환
import * as jwt from 'jsonwebtoken';
import jwtConfig, { jwtExpConfig } from '@/config/jwtConfig';
import accessTokenConfig from '@/config/accessTokenConfig';
import { ConfigType } from '@nestjs/config';
import { IUser } from '@/type-defs/message.interface';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
  async validateWithIdPw(user: LoginUserDto) {
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

  async findByUserId(id: string) {
    const command = new GetUserByUserIdQuery(id);
    const user = await this.queryBus.execute(command);

    if (!user) {
      throw new BadRequestException(`No user found with id ${id}`);
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

  async verifyJwt(jwtString: string) {
    let payload = null;
    const user = {} as IUser;
    try {
      payload = jwt.verify(jwtString, this.jwtConf.jwtSecret) as (
        | jwt.JwtPayload
        | string
      ) &
        IUser;

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

  async issueToken(user: IUser) {
    // TODO: 유저 uuid 엔티티 이름 변경, uuid 생성 방법 변경
    return jwt.sign(user, this.jwtConf.jwtSecret, jwtExpConfig);
  }
}
