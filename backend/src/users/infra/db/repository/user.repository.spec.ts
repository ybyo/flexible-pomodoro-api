import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToClassFromExist } from 'class-transformer';
import { DataSource, Repository } from 'typeorm';

import { RedisTokenService } from '@/redis/redis-token.service';
import { User, UserJwt, UserWithoutPassword } from '@/users/domain/user.model';
import { EmailService } from '@/users/infra/adapter/email.service';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserRepository } from '@/users/infra/db/repository/user.repository';

describe('UserRepository', () => {
  let userRepo: UserRepository;
  let repo: Repository<UserEntity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: EmailService,
          useValue: {
            sendSignupEmailToken: jest.fn(),
            sendResetPasswordToken: jest.fn(),
            sendChangeEmailToken: jest.fn(),
          },
        },
        {
          provide: RedisTokenService,
          useValue: {
            setPXAT: jest.fn(),
            deleteValue: jest.fn(),
          },
        },
      ],
    }).compile();

    repo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    userRepo = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user', async () => {
      const expectedUserEntity = new UserEntity({ email: 'email@example.com' });
      const expectedUser = plainToClassFromExist(
        new User(),
        expectedUserEntity
      );

      repo.findOneBy = jest.fn().mockResolvedValue(expectedUser);

      const actualUser = await userRepo.findByEmail('email@example.com');

      expect(actualUser).toEqual(expectedUser);
      expect(repo.findOneBy).toHaveBeenCalledWith({
        email: 'email@example.com',
      });
    });

    it('should return a null', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue(null);

      const actualUser = await userRepo.findByEmail('email@example.com');

      expect(actualUser).toEqual(null);
      expect(repo.findOneBy).toHaveBeenCalledWith({
        email: 'email@example.com',
      });
    });
  });

  describe('findById', () => {
    it('should return a user', async () => {
      const expectedUserEntity = new UserEntity({ id: 'example' });
      const expectedUser = plainToClassFromExist(
        new UserJwt(),
        expectedUserEntity
      );

      repo.findOneBy = jest.fn().mockResolvedValue(expectedUser);

      const actualUser = await userRepo.findById('example');

      expect(actualUser).toEqual(expectedUser);
      expect(repo.findOneBy).toHaveBeenCalledWith({
        id: 'example',
      });
    });

    it('should return a null', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue(null);

      const actualUser = await userRepo.findById('example');

      expect(actualUser).toEqual(null);
      expect(repo.findOneBy).toHaveBeenCalledWith({
        id: 'example',
      });
    });
  });

  describe('findByEmailAndPassword', () => {
    it('should return a user', async () => {
      const expectedUserEntity = new UserEntity({
        email: 'email@example.com',
        password: 'password',
      });
      const expectedUser = plainToClassFromExist(
        new UserWithoutPassword(),
        expectedUserEntity
      );

      repo.findOneBy = jest.fn().mockResolvedValue(expectedUser);

      const actualUser = await userRepo.findByEmailAndPassword(
        'email@example.com',
        'password'
      );

      expect(actualUser).toEqual(expectedUser);
      expect(repo.findOneBy).toHaveBeenCalledWith({
        email: 'email@example.com',
        password: 'password',
      });
    });

    it('should return a null', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue(null);

      const actualUser = await userRepo.findByEmailAndPassword(
        'email@example.com',
        'password'
      );

      expect(actualUser).toEqual(null);
      expect(repo.findOneBy).toHaveBeenCalledWith({
        email: 'email@example.com',
        password: 'password',
      });
    });
  });

  describe('findBySignupToken', () => {
    it('should return a userEntity', async () => {
      const expectedUser = new UserEntity({ signupToken: 'token' });

      repo.findOneBy = jest.fn().mockResolvedValue(expectedUser);

      const actualUser = await userRepo.findBySignupToken('token');

      expect(actualUser).toEqual(expectedUser);
      expect(repo.findOneBy).toHaveBeenCalledWith({ signupToken: 'token' });
    });

    it('should return a null', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue(null);

      const actualUser = await userRepo.findBySignupToken('token');

      expect(actualUser).toEqual(null);
      expect(repo.findOneBy).toHaveBeenCalledWith({ signupToken: 'token' });
    });
  });

  describe('findByResetPasswordToken', () => {
    it('should return a userEntity', async () => {
      const expectedUser = new UserEntity({ resetPasswordToken: 'token' });

      repo.findOneBy = jest.fn().mockResolvedValue(expectedUser);

      const actualUser = await userRepo.findByResetPasswordToken('token');

      expect(actualUser).toEqual(expectedUser);
      expect(repo.findOneBy).toHaveBeenCalledWith({
        resetPasswordToken: 'token',
      });
    });

    it('should return a null', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue(null);

      const actualUser = await userRepo.findByResetPasswordToken('token');

      expect(actualUser).toEqual(null);
      expect(repo.findOneBy).toHaveBeenCalledWith({
        resetPasswordToken: 'token',
      });
    });
  });
});
