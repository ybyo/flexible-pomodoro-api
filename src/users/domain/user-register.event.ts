import { IEvent } from '@nestjs/cqrs';

import { CqrsEvent } from './cqrs-event';

export class UserRegisterEvent extends CqrsEvent implements IEvent {
  constructor(readonly email: string, readonly signupToken: string) {
    super(UserRegisterEvent.name);
  }
}
