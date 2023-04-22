import { ICommand } from '@nestjs/cqrs';

export class CheckEmailDupCmd implements ICommand {
  constructor(readonly email: string) {}
}
