import { ICommand } from '@nestjs/cqrs';

export class RegisterUserCommand implements ICommand {
  constructor(
    // Signup
    readonly userName: string,
    readonly email: string,
    readonly password: string,
  ) {}
}
