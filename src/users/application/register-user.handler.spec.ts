import { InternalServerErrorException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Chance } from 'chance';
import { ulid } from 'ulid';

import { RegisterUserHandler } from '@/auth/command/handler/register-user.handler';
import { RegisterUserCmd } from '@/auth/command/impl/register-user.cmd';
import { UserFactory } from '@/users/domain/user.factory';
import { UserRepository } from '@/users/infra/db/repository/user.repository';

const chance = new Chance();

const user = {
  id: ulid(),
  email: chance.email(),
  userName: chance.name(),
  password: chance.string(),
  signupToken: ulid(),
};

describe('RegisterUserHandler', () => {
  let registerUserHandler: RegisterUserHandler;
  let userFactory: UserFactory;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RegisterUserHandler,
        {
          provide: UserFactory,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: 'UserRepository',
          useValue: {
            saveUser: jest.fn(),
          },
        },
      ],
    }).compile();

    registerUserHandler = module.get(RegisterUserHandler);
    userFactory = module.get(UserFactory);
    userRepository = module.get('UserRepository');
  });

  describe('execute', () => {
    it('should execute a RegisterUserCommand', async () => {
      // Given
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);
      userRepository.saveUser = jest.fn();

      // When
      await registerUserHandler.execute(
        new RegisterUserCommand(user.userName, user.email, user.password),
      );

      // Then
      expect(userRepository.saveUser).toHaveBeenCalledWith(user);
      expect(userFactory.create).toHaveBeenCalledWith(user);
    });

    it('should throw an InternalServerErrorException when users exists', async () => {
      // Given
      userRepository.findByEmail = jest.fn().mockResolvedValue({
        userObject: user,
      });

      // When
      // Then
      await expect(
        registerUserHandler.execute(
          new RegisterUserCommand(user.userName, user.email, user.password),
        ),
      ).rejects.toThrowError(
        new InternalServerErrorException('Duplicate email'),
      );
    });

    it('should throw an InternalServerErrorException when save user data fails', async () => {
      // Given
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);
      userRepository.saveUser = jest.fn().mockRejectedValue(new Error());

      // When
      // Then
      await expect(
        registerUserHandler.execute(
          new RegisterUserCommand(user.userName, user.email, user.password),
        ),
      ).rejects.toThrowError(
        new InternalServerErrorException('Failed to save user'),
      );
    });
  });
});
