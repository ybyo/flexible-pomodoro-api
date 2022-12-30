import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserCreatedEvent } from './user-created.event';
import { User } from './user';

@Injectable()
export class UserFactory {
  // TODO: 구현된 메소드들이 오브젝트들을 받도록 구현
  constructor(private eventBus: EventBus) {}

  create(user: User): User {
    this.eventBus.publish(
      new UserCreatedEvent(user.email, user.signupVerifyToken),
    );

    return user;
  }

  reconstitute(user: User): User {
    return user;
  }
}
