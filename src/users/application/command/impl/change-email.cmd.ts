import { ICommand } from '@nestjs/cqrs';

export class ChangeEmailCmd implements ICommand {
  constructor(
    readonly oldEmail: string,
    readonly newEmail: string,
    readonly changeEmailVerifyToken: string,
  ) {}
}
