import { EventBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { User } from './user';
import { UserFactory } from './user.factory';

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
    it('Should create user', () => {
      // Given
      // When
      const user = userFactory.create(
        'test',
        'test',
        'test@example.com',
        'test',
        'test',
      );
      // Then
      const expected = new User(
        'test',
        'test',
        'test@example.com',
        'test',
        'test',
      );
      expect(expected).toEqual(user);
      expect(eventBus.publish).toBeCalledTimes(1);
    });
  });

  describe('reconstitute', () => {
    it('Should reconstitute user', () => {
      // Given
      // When
      const user = userFactory.reconstitute(
        'test',
        'test',
        'test@example.com',
        'test',
        'test',
      );
      // Then
      const expected = new User(
        'test',
        'test',
        'test@example.com',
        'test',
        'test',
      );
      expect(expected).toEqual(user);
    });
  });
});
