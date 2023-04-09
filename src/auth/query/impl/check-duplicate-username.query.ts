import { IQuery } from '@nestjs/cqrs';

export class CheckDuplicateUsernameQuery implements IQuery {
  constructor(readonly username: string) {}
}
