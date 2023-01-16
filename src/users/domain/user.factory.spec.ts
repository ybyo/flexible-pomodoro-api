import { UserFactory } from './user.factory';
import { User } from './user.model';
import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import * as ulid from 'ulid';
import { Chance } from 'chance';

const chance = new Chance();

// TODO: 공통 오브젝트 임포트해서 사용하도록 타입 근처에 정의
const userObject: Partial<User> = {
  id: ulid.ulid(),
  userName: chance.name(),
  email: chance.email(),
  password: chance.string(),
  signupVerifyToken: ulid.ulid(),
};

const newUser = new User(userObject);

describe('UserFactory', () => {
  let userFactory: UserFactory;
  let eventBus: jest.Mocked<EventBus>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserFactory,
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    userFactory = module.get(UserFactory);
    eventBus = module.get(EventBus);
  });

  describe('create', () => {
    it('Should create users', () => {
      // Given
      // When
      const user = userFactory.create(newUser);
      // Then
      const expected = new User(userObject);
      expect(expected).toEqual(user);
      expect(eventBus.publish).toBeCalledTimes(1);
    });
  });

  describe('reconstitute', () => {
    it('Should reconstitute users', () => {
      // Given
      // When
      const user = userFactory.reconstitute(newUser);
      // Then
      const expected = new User(userObject);
      expect(expected).toEqual(user);
    });
  });
});
