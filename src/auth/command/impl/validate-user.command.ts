import { ICommand } from '@nestjs/cqrs';

export class ValidateUserCommand implements ICommand {
  constructor(readonly email: string, readonly password: string) {}
}
