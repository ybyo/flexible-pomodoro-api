import { UserRepository } from '../infra/db/repository/UserRepository';
import { UserFactory } from '../domain/user.factory';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateUserHandler } from './command/create-user.handler';
import { CreateUserCommand } from './command/create-user.command';
import * as ulid from 'ulid';
import { User } from '../domain/user';

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

  const userObject: Partial<User> = {
    uid: ulid.ulid(),
    userName: 'test',
    email: 'test@example.com',
    password: 'test',
    signupVerifyToken: ulid.ulid(),
  };

  describe('execute', () => {
    it('should execute CreateUserCommand', async () => {
      // Given
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);

      // When
      await createUserHandler.execute(
        new CreateUserCommand(
          userObject.userName,
          userObject.email,
          userObject.password,
        ),
      );

      // Then
      expect(userRepository.saveUser).toBeCalledWith(userObject);
      expect(userFactory.create).toBeCalledWith(userObject);
    });

    it('should throw UnprocessableEntityException when user exists', async () => {
      // Given
      userRepository.findByEmail = jest.fn().mockResolvedValue({
        userObject,
      });

      // When
      // Then
      await expect(
        createUserHandler.execute(
          new CreateUserCommand(
            userObject.userName,
            userObject.email,
            userObject.password,
          ),
        ),
      ).rejects.toThrowError(UnprocessableEntityException);
    });
  });
});
