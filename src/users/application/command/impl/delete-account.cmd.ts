import { ICommand } from '@nestjs/cqrs';

export class DeleteAccountCmd implements ICommand {
  constructor(readonly id: string) {}
}
