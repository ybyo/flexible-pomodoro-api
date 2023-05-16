import { ICommand } from '@nestjs/cqrs';

export class DeleteAccountCommand implements ICommand {
  constructor(readonly id: string) {}
}
