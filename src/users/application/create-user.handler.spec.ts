import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as ulid from 'ulid';
import { UserFactory } from '../domain/user.factory';
import { UserRepository } from '../infra/db/repository/UserRepository';
import { CreateUserCommand } from './command/create-user.command';
import { CreateUserHandler } from './command/create-user.handler';

jest.mock('ulid');
jest.spyOn(ulid, 'ulid').mockReturnValue('ulid');

describe('CreateUserHandler', () => {
  let createUserHandler: CreateUserHandler;
  let userFactory: UserFactory;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        {
          provide: UserFactory,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: 'UserRepository',
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    createUserHandler = module.get(CreateUserHandler);
    userFactory = module.get(UserFactory);
    userRepository = module.get('UserRepository');
  });

  const id = ulid.ulid();
  const name = 'test';
  const email = 'test@example.com';
  const password = 'test';
  const signupVerifyToken = ulid.ulid();

  describe('execute', () => {
    it('should execute CreateUserCommand', async () => {
      // Given
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);

      // When
      await createUserHandler.execute(
        new CreateUserCommand(name, email, password),
      );

      // Then
      expect(userRepository.save).toBeCalledWith(
        id,
        name,
        email,
        password,
        signupVerifyToken,
      );
      expect(userFactory.create).toBeCalledWith(
        id,
        name,
        email,
        password,
        signupVerifyToken,
      );
    });

    it('should throw UnprocessableEntityException when user exists', async () => {
      // Given
      userRepository.findByEmail = jest.fn().mockResolvedValue({
        id,
        name,
        email,
        password,
        signupVerifyToken,
      });

      // When
      // Then
      await expect(
        createUserHandler.execute(new CreateUserCommand(name, email, password)),
      ).rejects.toThrowError(UnprocessableEntityException);
    });
  });
});
