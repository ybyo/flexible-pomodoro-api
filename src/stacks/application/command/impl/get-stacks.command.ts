import { ICommand } from '@nestjs/cqrs';

export class GetStacksCommand implements ICommand {
  constructor(readonly id: string) {}
}
