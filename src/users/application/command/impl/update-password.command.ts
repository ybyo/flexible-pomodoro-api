import { ICommand } from '@nestjs/cqrs';

export class UpdatePasswordCommand implements ICommand {
  constructor(readonly email: string, readonly newPassword: string) {}
}
