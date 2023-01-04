import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    readonly email: string,
    readonly userName: string,
    readonly password: string,
  ) {}
}
