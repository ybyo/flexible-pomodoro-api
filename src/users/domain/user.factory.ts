import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { User } from './user.model';
import { UserRegisterEvent } from './user-register.event';

@Injectable()
export class UserFactory {
  constructor(private eventBus: EventBus) {}

  async create(user: User): Promise<User> {
    await this.eventBus.publish(
      new UserRegisterEvent(user.email, user.signupVerifyToken),
    );

    return user;
  }

  reconstitute(user: User): User {
    return user;
  }
}
