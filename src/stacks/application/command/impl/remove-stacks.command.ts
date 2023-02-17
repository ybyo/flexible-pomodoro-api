import { ICommand } from '@nestjs/cqrs';

export class RemoveStacksCommand implements ICommand {
  constructor(readonly id: string) {}
}
