import { CheckDupNameQry } from '@/auth/query/impl/check-dup-name.qry';
import { ChangeNameCmd } from '@/users/application/command/impl/change-name.cmd';
import { User } from '@/users/domain/user.model';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as jwt from 'jsonwebtoken';
import { ulid } from 'ulid';

import { ValidateUserCmd } from '@/auth/command/impl/validate-user.cmd';
import { GetUserByIdQry } from '@/auth/query/impl/get-user-by-id.qry';
import accessTokenConfig from '@/config/accessTokenConfig';
import jwtConfig, { jwtExpConfig } from '@/config/jwtConfig';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { IRedisTokenService } from '@/users/application/adapter/iredis-token.service';
import { CheckTokenValidQry } from '@/users/application/command/impl/check-token-valid.qry';
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
    @Inject('RedisTokenService') private redisService: IRedisTokenService,
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

  async validateToken(event: string, token: string): Promise<void> {
    const qry = new CheckTokenValidQry(event, token);
    const { id } = await this.queryBus.execute(qry);

    if (id === undefined) {
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

  async addTokenAndSendMail(
    email: string,
    event: string,
    ttl: number,
  ): Promise<IRes> {
    const user = await this.userRepository.findByEmail(email);

    if (user !== null) {
      const token = await this.issueUlid();

      await this.userRepository.updateToken(user, event, token, true);
      await this.redisService.setValue(`${event}:${token}`, '1', ttl);

      return { success: true };
    }

    throw new BadRequestException(`Cannot process ${event}`);
  }

  async validateAndIssueJWT(event: string, token: string): Promise<string> {
    const qry = new CheckTokenValidQry('resetPasswordToken', token);
    const user = await this.queryBus.execute(qry);

    if (user !== null) {
      const jwt = await this.issueJWT({
        id: user.id,
        userName: user.userName,
        email: user.email,
      });

      return jwt;
    }

    await this.redisService.deleteValue(`${event}:${token}`);

    throw new BadRequestException('Invalid token');
  }

  async splitEventToken(req) {
    const raw = req.query;
    if (raw === null) throw new BadRequestException(`Invalid request`);

    const event = Object.keys(raw)[0] as string;
    const token = Object.values(raw)[0] as string;

    return { event, token };
  }

  async changePassword(token: string, newPassword: string): Promise<IRes> {
    const result = await this.verifyJWT(token);

    if (result.success) {
      await this.userRepository.updateUser(
        { email: result.data.email },
        { password: newPassword, resetPasswordToken: null },
      );

      return { success: true };
    }

    throw new InternalServerErrorException('Cannot update password');
  }

  async changeNameAndJWT(
    email: string,
    newName: string,
  ): Promise<IRes<string>> {
    const qry = new CheckDupNameQry(newName);
    const { success, data: user } = await this.queryBus.execute(qry);

    const cmd = new ChangeNameCmd(email, newName);
    await this.commandBus.execute(cmd);

    const newUser = { id: user.id, email: user.email, userName: newName };
    const newAccessToken = await this.issueJWT(newUser);

    return {
      success: true,
      data: newAccessToken,
    };
  }

  async saveUser(user: any): Promise<void> {
    const id = ulid();
    const signupToken = ulid();
    const tokenLifetime = 1 * 60 * 60;

    const newUser = new User({
      ...user,
      id,
      signupToken,
    });

    await this.redisService.setValue(
      `signupToken:${signupToken}`,
      '1',
      tokenLifetime,
    );

    await this.userRepository.saveUser(newUser);
  }

  async issueJWT(user: IUser): Promise<string> {
    const token = jwt.sign(user, this.jwtConf.jwtSecret, jwtExpConfig);

    return token;
  }

  async issueUlid(): Promise<string> {
    return ulid();
  }
}
