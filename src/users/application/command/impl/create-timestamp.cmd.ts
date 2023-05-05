import { ICommand } from '@nestjs/cqrs';

export class CreateTimestampCmd implements ICommand {
  constructor(readonly id: string, readonly target: string) {}
}
