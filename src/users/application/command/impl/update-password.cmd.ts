import { ICommand } from '@nestjs/cqrs';

import { User } from '@/users/domain/user.model';

export class UpdatePasswordCmd implements ICommand {
  constructor(readonly token: string, readonly newPassword: string) {}
}
