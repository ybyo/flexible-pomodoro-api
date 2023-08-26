import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { RedisTokenService } from '@/redis/redis-token.service';
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
      repo.findOneBy = jest
        .fn()
        .mockResolvedValue({ email: 'email@example.com' });

      const user = await userRepo.findByEmail('email@example.com');

      expect(user).toEqual({ email: 'email@example.com' });
    });

    it('should return a null', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue(null);

      const user = await userRepo.findByEmail('email@example.com');

      expect(user).toEqual(null);
    });
  });

  describe('findByEmailAndPassword', () => {
    it('should return a user', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue({
        email: 'email@example.com',
        password: 'password',
      });

      const user = await userRepo.findByEmailAndPassword(
        'email@example.com',
        'password'
      );

      expect(user).toEqual({
        email: 'email@example.com',
        password: 'password',
      });
    });

    it('should return a null', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue(null);

      const user = await userRepo.findByEmailAndPassword(
        'email@example.com',
        'password'
      );

      expect(user).toEqual(null);
    });
  });
});
