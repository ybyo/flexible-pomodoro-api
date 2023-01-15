import { ICommand } from '@nestjs/cqrs';

export class GetFragsCommand implements ICommand {
  constructor(readonly id: string) {}
}
