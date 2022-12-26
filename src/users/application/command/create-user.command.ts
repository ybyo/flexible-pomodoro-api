import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    readonly userName: string,
    readonly email: string,
    readonly password: string,
  ) {}
}
