import { ICommand } from '@nestjs/cqrs';

export class CheckDupUserQry implements ICommand {
  constructor(
    readonly userName: string,
    readonly email: string,
    readonly password: string,
  ) {}
}
