import { ICommand } from '@nestjs/cqrs';

export class AddResetTokenCmd implements ICommand {
  constructor(
    readonly email: string,
    readonly resetPasswordVerifyToken: string,
  ) {}
}
