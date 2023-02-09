import { ICommand } from '@nestjs/cqrs';

export class CheckEmailCommand implements ICommand {
  constructor(readonly email: string) {}
}
