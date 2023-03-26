import { ICommand } from '@nestjs/cqrs';

export class AddResetTokenCommand implements ICommand {
  constructor(
    readonly email: string,
    readonly resetPasswordVerifyToken: string,
  ) {}
}
