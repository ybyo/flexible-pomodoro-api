import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as jwt from 'jsonwebtoken';
import { ulid } from 'ulid';

import { ValidateUserCmd } from '@/auth/command/impl/validate-user.cmd';
import { GetUserByIdQry } from '@/auth/query/impl/get-user-by-id.qry';
import accessTokenConfig from '@/config/accessTokenConfig';
import jwtConfig, { jwtExpConfig } from '@/config/jwtConfig';
import { IUser } from '@/customTypes/interfaces/message.interface';
import { RedisTokenService } from '@/redis/redis-token.service';
import { CheckTokenValidityQry } from '@/users/application/command/impl/check-token-validity.qry';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { LoginUserDto } from '@/users/interface/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY) private jwtConf: ConfigType<typeof jwtConfig>,
    @Inject(accessTokenConfig.KEY)
    private accessTokenConf: ConfigType<typeof accessTokenConfig>,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private redisService: RedisTokenService,
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  // Interact with passport local strategy
  async validateWithIdPw(user: LoginUserDto) {
    const { email, password } = user;
    const command = new ValidateUserCmd(email, password);

    return await this.commandBus.execute(command);
  }

  async findByUserId(id: string) {
    const qry = new GetUserByIdQry(id);

    return await this.queryBus.execute(qry);
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

  async updateToken(event: string, token: string): Promise<void> {
    const qry = new CheckTokenValidityQry(event, token);
    const { id } = await this.queryBus.execute(qry);

    if (id !== undefined) {
      await this.redisService.deleteValue(`${event}:${token}`);
      throw new BadRequestException('Invalid token');
    }

    const redis = await this.redisService.getClient();
    const multi = redis.multi();
    multi.del(`${event}:${token}`);

    try {
      await this.userRepository.getDataSource().transaction(async (manager) => {
        await manager.update(UserEntity, { id }, { [event]: null });
        await multi.exec();
      });
    } catch (err) {
      await multi.discard();
    }
  }

  async issueJWT(user: IUser): Promise<string> {
    const token = jwt.sign(user, this.jwtConf.jwtSecret, jwtExpConfig);

    return token;
  }

  async issueUlid(): Promise<string> {
    return ulid();
  }
}
