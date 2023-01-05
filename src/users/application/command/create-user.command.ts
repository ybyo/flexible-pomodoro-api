import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    // Signup
    readonly userName: string,
    readonly email: string,
    readonly password: string,
  ) {}
}
