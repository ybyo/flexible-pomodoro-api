import { ICommand } from '@nestjs/cqrs';

export class VerifyResetPasswordTokenCmd implements ICommand {
  constructor(readonly resetPasswordToken: string) {}
}
