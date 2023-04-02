import { ICommand } from '@nestjs/cqrs';

export class DeleteAccountCommand implements ICommand {
  constructor(readonly email: string) {}
}
