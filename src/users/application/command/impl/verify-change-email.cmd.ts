import { ICommand } from '@nestjs/cqrs';

export class VerifyChangeEmailCmd implements ICommand {
  constructor(readonly changeEmailToken: string) {}
}
