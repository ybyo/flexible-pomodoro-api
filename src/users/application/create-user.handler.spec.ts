import * as ulid from 'ulid';
import { CreateUserCommand } from './command/create-user.command';
import { CreateUserHandler } from './command/create-user.handler';
import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { UserFactory } from '../domain/user.factory';
import { UserRepository } from '../infra/db/repository/UserRepository';
import { Chance } from 'chance';

const chance = new Chance();

jest.mock('ulid');
jest.spyOn(ulid, 'ulid').mockReturnValue('ulid');

// DTO 사용
const userObject = {
  _userId: ulid.ulid(),
  _email: chance.email(),
  _userName: chance.name(),
  _password: chance.string(),
  _signupVerifyToken: ulid.ulid(),
};

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
            saveUser: jest.fn(),
          },
        },
      ],
    }).compile();

    createUserHandler = module.get(CreateUserHandler);
    userFactory = module.get(UserFactory);
    userRepository = module.get('UserRepository');
  });

  describe('execute', () => {
    it('should execute CreateUserCommand', async () => {
      // Given
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);

      // When
      await createUserHandler.execute(
        new CreateUserCommand(
          userObject._userName,
          userObject._email,
          userObject._password,
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
            userObject._userName,
            userObject._email,
            userObject._password,
          ),
        ),
      ).rejects.toThrowError(UnprocessableEntityException);
    });
  });
});
