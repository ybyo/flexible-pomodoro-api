import { ICommand } from '@nestjs/cqrs';

export class UpdatePasswordCmd implements ICommand {
  constructor(readonly email: string, readonly newPassword: string) {}
}
