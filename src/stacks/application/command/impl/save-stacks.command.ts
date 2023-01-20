import { ICommand } from '@nestjs/cqrs';
import { Stacks } from '@/stacks/domain/stacks.model';

export class SaveStacksCommand implements ICommand {
  constructor(readonly id: string, readonly stacks: Stacks[]) {}
}
