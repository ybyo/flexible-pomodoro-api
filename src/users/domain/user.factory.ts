import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserCreatedEvent } from './user-created.event';
import { User } from './user';

@Injectable()
export class UserFactory {
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
