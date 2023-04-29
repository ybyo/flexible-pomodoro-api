import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { User } from './user.model';

@Injectable()
export class UserFactory {
  constructor(private eventBus: EventBus) {}

  async create(user: User): Promise<User> {
    return user;
  }

  reconstitute(user: User): User {
    return user;
  }
}
