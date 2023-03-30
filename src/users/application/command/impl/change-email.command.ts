import { ICommand } from '@nestjs/cqrs';

export class ChangeEmailCommand implements ICommand {
  constructor(
    readonly oldEmail: string,
    readonly changeEmailVerifyToken: string,
  ) {}
}
