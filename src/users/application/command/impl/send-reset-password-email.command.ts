import { ICommand } from '@nestjs/cqrs';

export class SendResetPasswordEmailCommand implements ICommand {
  constructor(readonly email: string) {}
}
