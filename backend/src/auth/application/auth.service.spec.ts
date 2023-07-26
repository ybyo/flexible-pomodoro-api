import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Request } from 'express';

import { AuthService } from '@/auth/application/auth.service';
import accessTokenConfig from '@/config/access-token.config';
import jwtConfig from '@/config/jwt.config';
import { RedisTokenService } from '@/redis/redis-token.service';
import { CheckResetPasswordTokenValidityHandler } from '@/users/application/query/handlers/check-reset-password-token-validity.handler';
import { IUserRepository } from '@/users/domain/iuser.repository';
import { CreateRandomObject } from '@/utils/test-object-builder.util';

const jwtConf = {
  secret: 'default_secret',
  expiresIn: '365d',
};

const accessTokenConf: ConfigType<typeof accessTokenConfig> = {
  maxAge: +process.env.ACCESS_LIFETIME * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  domain: process.env.HOST_URL,
  path: '/',
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: IUserRepository;
  let jwtService: JwtService;
  let queryBus: QueryBus;

  const getRandomString = () => `${Date.now()}`;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        CheckResetPasswordTokenValidityHandler,
        {
          provide: 'UserRepository',
          useValue: {
            findByEmail: jest.fn(),
            changePassword: jest.fn(),
            registerUser: jest.fn(),
            verifySignupToken: jest.fn(),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: jwtConf,
        },
        {
          provide: accessTokenConfig.KEY,
          useValue: accessTokenConf,
        },
        {
          provide: 'RedisTokenService',
          useValue: RedisTokenService,
        },
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    userRepository = moduleRef.get<IUserRepository>('UserRepository');
    jwtService = moduleRef.get<JwtService>(JwtService);
    queryBus = moduleRef.get<QueryBus>(QueryBus);

    jest.spyOn(jwtService, 'sign');
    jest.spyOn(jwtService, 'verify');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyPassword', () => {
    it('success, should verify with argon2 package', async () => {
      const user = CreateRandomObject.RandomUser();

      const password = user.password;
      const hashedPassword = await argon2.hash(password);

      const result = await authService.verifyPassword(hashedPassword, password);

      expect(result).toBe(true);
    });

    it('false, should verify with argon2 package', async () => {
      const user = CreateRandomObject.RandomUser();

      const password = user.password;
      const hashedPassword = await argon2.hash(password);
      let wrongPassword = '';
      do {
        wrongPassword = CreateRandomObject.RandomUser().password;
      } while (password === wrongPassword);

      const result = await authService.verifyPassword(
        hashedPassword,
        wrongPassword
      );

      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('success, should return user', async () => {
      const user = CreateRandomObject.RandomUser();
      const loginUserDto = { email: user.email, password: user.password };

      userRepository.findByEmail = jest.fn().mockResolvedValue(user);
      authService.verifyPassword = jest.fn().mockResolvedValue(true);
      const result = await authService.login(loginUserDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        loginUserDto.email
      );
      expect(authService.verifyPassword).toHaveBeenCalledWith(
        user.password,
        loginUserDto.password
      );
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });

    it('failure case 1, should return BadRequestException', async () => {
      const user = CreateRandomObject.RandomUser();
      const dto = { email: user.email, password: user.password };

      userRepository.findByEmail = jest.fn().mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow(
        new BadRequestException('No matching account information')
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(dto.email);
    });

    it('failure case 2, should return BadRequestException', async () => {
      const user = CreateRandomObject.RandomUser();
      const dto = { email: user.email, password: user.password };

      userRepository.findByEmail = jest.fn().mockResolvedValue(user);
      authService.verifyPassword = jest.fn().mockResolvedValue(false);

      await expect(authService.login(dto)).rejects.toThrow(
        new BadRequestException('Incorrect email or password')
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(authService.verifyPassword).toHaveBeenCalledWith(
        user.password,
        dto.password
      );
    });
  });

  describe('verifyJwt', () => {
    it('should verify JWT and return payload', async () => {
      const payload = CreateRandomObject.RandomUserJwt();
      const jwtString = jwtService.sign({ ...payload }, jwtConf);

      const result = await authService.verifyJwt(jwtString);

      expect(jwtService.verify).toHaveBeenCalledWith(jwtString, jwtConf);
      expect(result).toEqual({
        success: true,
        data: {
          id: payload.id,
          email: payload.email,
          username: payload.username,
        },
      });
    });

    it('should throw JsonWebTokenError', async () => {
      const payload = CreateRandomObject.RandomUserJwt();
      const jwtString = jwtService.sign({ ...payload }, jwtConf);
      let wrongJwtString;
      do {
        wrongJwtString = getRandomString();
      } while (jwtString === wrongJwtString);

      await expect(authService.verifyJwt(wrongJwtString)).rejects.toThrow(
        new BadRequestException('Cannot verify JWT token')
      );
      expect(jwtService.verify).toHaveBeenCalledWith(wrongJwtString, jwtConf);
    });
  });

  describe('verifyResetPasswordToken', () => {
    const event = getRandomString();
    const token = getRandomString();
    const jwt = getRandomString();
    const req = {} as Request;
    req.query = { request: { [event]: token } };

    it('should return jwt', async () => {
      const user = CreateRandomObject.RandomUserJwt();

      authService.splitEventToken = jest
        .fn()
        .mockResolvedValue({ event, token });
      queryBus.execute = jest.fn().mockResolvedValue(user);
      authService.issueJWT = jest.fn().mockResolvedValue(jwt);

      expect(await authService.verifyResetPasswordToken(req)).toBe(jwt);
    });

    it('should throw BadRequestException', async () => {
      authService.splitEventToken = jest
        .fn()
        .mockResolvedValue({ event, token });
      queryBus.execute = jest.fn().mockResolvedValue(null);
      authService.issueJWT = jest.fn().mockResolvedValue(jwt);

      await expect(
        authService.verifyResetPasswordToken(req)
      ).rejects.toThrowError(new BadRequestException(`Invalid ${event} token`));
    });
  });

  describe('changePassword', () => {
    const token = getRandomString();
    const newPassword = getRandomString();
    const result = {
      success: true,
      data: CreateRandomObject.RandomUserJwt(),
    };

    it('should return success', async () => {
      const updateResult = { affected: 1 };

      authService.verifyJwt = jest.fn().mockResolvedValue(result);
      userRepository.changePassword = jest.fn().mockResolvedValue(updateResult);

      expect(await authService.changePassword(token, newPassword)).toEqual({
        success: true,
      });
      expect(authService.verifyJwt).toHaveBeenCalledWith(token);
      expect(userRepository.changePassword).toHaveBeenCalledWith(
        result.data.id,
        token,
        newPassword
      );
    });

    it('verified JWT, but throw InternalServerErrorException', async () => {
      authService.verifyJwt = jest.fn().mockResolvedValue(result);
      userRepository.changePassword = jest.fn().mockRejectedValue(new Error());

      await expect(
        authService.changePassword(token, newPassword)
      ).rejects.toThrowError(
        new InternalServerErrorException('Cannot update password')
      );
      expect(authService.verifyJwt).toHaveBeenCalledWith(token);
      expect(userRepository.changePassword).toHaveBeenCalledWith(
        result.data.id,
        token,
        newPassword
      );
    });
  });
});
