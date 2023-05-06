import { ICommand } from '@nestjs/cqrs';

export class ChangeNameCmd implements ICommand {
  constructor(readonly email: string, readonly newName: string) {}
}
