import { ICommand } from '@nestjs/cqrs';

export class VerifyResetPasswordTokenCmd implements ICommand {
  constructor(readonly resetPasswordVerifyToken: string) {}
}
