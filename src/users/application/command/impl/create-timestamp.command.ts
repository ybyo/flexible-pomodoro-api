import { ICommand } from '@nestjs/cqrs';

export class CreateTimestampCommand implements ICommand {
  constructor(readonly id: string, readonly target: string) {}
}
