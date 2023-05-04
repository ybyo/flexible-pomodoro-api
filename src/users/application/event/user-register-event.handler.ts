import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { UserRegisterEvent } from '@/users/domain/user-register.event';

import { IEmailService } from '../adapter/iemail.service';

@EventsHandler(UserRegisterEvent)
export class UserRegisterEventHandler
  implements IEventHandler<UserRegisterEvent>
{
  constructor(@Inject('EmailService') private emailService: IEmailService) {}

  async handle(event: UserRegisterEvent) {
    switch (event.name) {
      case UserRegisterEvent.name: {
        const { email, signupToken } = event as UserRegisterEvent;
        await this.emailService.sendTokenEmail('signup', email, signupToken);
        break;
      }
      default:
        break;
    }
  }
}
