import { ICommand } from '@nestjs/cqrs';

export class VerifyChangeEmailCmd implements ICommand {
  constructor(readonly changeEmailVerifyToken: string) {}
}
