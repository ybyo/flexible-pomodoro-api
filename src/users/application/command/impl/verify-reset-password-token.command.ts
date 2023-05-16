import { ICommand } from '@nestjs/cqrs';

export class VerifyResetPasswordTokenCommand implements ICommand {
  constructor(readonly resetPasswordToken: string) {}
}
