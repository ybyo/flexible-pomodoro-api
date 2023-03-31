import { ICommand } from '@nestjs/cqrs';

export class VerifyChangeEmailCommand implements ICommand {
  constructor(readonly changeEmailVerifyToken: string) {}
}
