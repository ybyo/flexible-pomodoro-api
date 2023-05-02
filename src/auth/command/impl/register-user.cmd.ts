import { ICommand } from '@nestjs/cqrs';

export class RegisterUserCmd implements ICommand {
  constructor(
    readonly userName: string,
    readonly email: string,
    readonly password: string,
  ) {}
}
