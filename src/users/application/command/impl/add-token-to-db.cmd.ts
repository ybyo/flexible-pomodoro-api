import { ICommand } from '@nestjs/cqrs';

export class AddTokenToDBCmd implements ICommand {
  constructor(
    readonly email: string,
    readonly event: string,
    readonly token: string,
  ) {}
}
