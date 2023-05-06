import { ICommand } from '@nestjs/cqrs';

export class ValidateUserCmd implements ICommand {
  constructor(readonly email: string, readonly password: string) {}
}
