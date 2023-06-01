import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ulid } from 'ulid';

import { CheckDuplicateNameQuery }              from '@/auth/application/query/impl/check-duplicate-name.query';
import { SuccessDto }                           from '@/auth/interface/dto/success.dto';
import accessTokenConfig                        from '@/config/access-token.config';
import jwtConfig, { jwtExpConfig }              from '@/config/jwt.config';
import { IRedisTokenAdapter }                   from '@/users/application/adapter/iredis-token.adapter';
import { ChangeNameCommand }                    from '@/users/application/command/impl/change-name.command';
import { CheckResetPasswordTokenValidityQuery } from '@/users/application/query/impl/check-reset-password-token-validity.query';
import { CheckSignupTokenValidityQuery }        from '@/users/application/query/impl/check-signup-token-validity.query';
import { IUserRepository }                      from '@/users/domain/iuser.repository';
import { User, UserJwt, UserWithoutPassword }   from '@/users/domain/user.model';
import { JwtResponseDto }                       from '@/users/interface/dto/jwt-response.dto';
import { LoginUserDto }                         from '@/users/interface/dto/login-user.dto';
import { RegisterUserDto }                      from '@/users/interface/dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY) private jwtConf: ConfigType<typeof jwtConfig>,
    @Inject(accessTokenConfig.KEY)
    private accessTokenConf: ConfigType<typeof accessTokenConfig>,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    @Inject('RedisTokenService') private redisService: IRedisTokenAdapter,
    @Inject('UserRepository') private userRepository: IUserRepository,
    private logger: Logger,
  ) {}

  async login(dto: LoginUserDto): Promise<UserJwt> {
    // TODO: 데이터베이스가 완전히 비어있을 때 에러 처리
    const storedUser = await this.userRepository.findByEmail(dto.email);
    if (!storedUser) {
      throw new UnauthorizedException('No matching account information');
    }

    const isValid = await this.verifyPassword(
      storedUser.password,
      dto.password,
    );
    if (!isValid) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    return {
      id: storedUser.id,
      email: storedUser.email,
      username: storedUser.username,
    };
  }

  async verifyPassword(
    hashedPassword: string,
    password: string,
  ): Promise<boolean> {
    return await argon2.verify(hashedPassword, password);
  }

  async verifyJWT(jwtString: string): Promise<JwtResponseDto> {
    let payload = null;

    try {
      payload = jwt.verify(
        jwtString,
        this.jwtConf.jwtSecret,
      ) as jwt.JwtPayload & UserWithoutPassword;

      return {
        success: true,
        data: {
          id: payload.id,
          email: payload.email,
          username: payload.username,
        },
      };
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async verifySignupToken(req: Request): Promise<SuccessDto> {
    const { event, token } = await this.splitEventToken(req.query);
    const key = `${event}:${token}`;

    const query = new CheckSignupTokenValidityQuery(token);
    const user = await this.queryBus.execute(query);

    if (user === null) {
      await this.redisService.deleteValue(key);
      throw new BadRequestException(`Invalid ${event}`);
    }

    const expiredAt = await this.redisService.getPexpiretime(key);
    const result = await this.userRepository.verifySignupToken(user.id, token);

    if (result.affected) {
      return { success: true };
    } else {
      await this.redisService.setPXAT(key, '1', expiredAt);
      throw new InternalServerErrorException(`Cannot verify ${event}`);
    }
  }

  async verifyResetPasswordToken(req: Request): Promise<string> {
    const result = await this.splitEventToken(req.query);

    const query = new CheckResetPasswordTokenValidityQuery(result.token);
    const user = await this.queryBus.execute(query);

    if (user !== null) {
      const jwt = await this.issueJWT({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      return jwt;
    }

    throw new BadRequestException('Invalid token');
  }

  async splitEventToken(query: any) {
    if (Object.keys(query).length === 0) {
      throw new BadRequestException('Invalid request');
    }

    const event = Object.keys(query)[0] as string;
    const token = Object.values(query)[0] as string;

    return { event, token };
  }

  async changePassword(
    token: string,
    newPassword: string,
  ): Promise<SuccessDto> {
    const result = await this.verifyJWT(token);

    if (result.success) {
      try {
        const updateResult = await this.userRepository.changePassword(
          result.data.id,
          newPassword,
          token,
        );

        if (updateResult.affected) return { success: true };
      } catch (err) {
        throw new InternalServerErrorException('Cannot update password');
      }
    }
  }

  async changeNameAndJWT(
    id: string,
    email: string,
    newName: string,
  ): Promise<any> {
    const query = new CheckDuplicateNameQuery(newName);
    const result = await this.queryBus.execute(query);

    if (!result.success) {
      const command = new ChangeNameCommand(email, newName);
      await this.commandBus.execute(command);

      const newAccessToken = await this.issueJWT({
        id: id,
        email,
        username: newName,
      });

      return {
        success: true,
        data: newAccessToken,
      };
    }

    throw new BadRequestException('Duplicate user name');
  }

  async registerUser(user: RegisterUserDto): Promise<SuccessDto> {
    const newUser = new User();
    newUser.email = user.email;
    newUser.username = user.username;
    newUser.password = user.password;

    try {
      const result = await this.userRepository.registerUser(newUser);

      if (result.email) return { success: true };
    } catch (err) {
      this.logger.log(err);

      if (err.code === 'ER_DUP_ENTRY') {
        const regex = /Duplicate entry '([^']+)'/;
        const match = err.message.match(regex);
        const duplicateValue = match ? match[1] : null;

        throw new BadRequestException(`${duplicateValue}`);
      } else {
        throw new InternalServerErrorException('Cannot register user');
      }
    }
  }

  async issueJWT(user: UserJwt): Promise<string> {
    const token = jwt.sign(user, this.jwtConf.jwtSecret, jwtExpConfig);

    return token;
  }

  async issueUlid(): Promise<string> {
    return ulid();
  }
}
