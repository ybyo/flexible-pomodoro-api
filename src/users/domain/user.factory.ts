import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserCreatedEvent } from './user-created.event';
import { User } from './user.model';

@Injectable()
export class UserFactory {
  constructor(private eventBus: EventBus) {}

  async create(user: User): Promise<User> {
    await this.eventBus.publish(
      new UserCreatedEvent(user.email, user.signupVerifyToken),
    );

    return user;
  }

  reconstitute(user: User): User {
    return user;
  }
}
