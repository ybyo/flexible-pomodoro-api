import { IQuery } from '@nestjs/cqrs';

export class CheckDupNameQry implements IQuery {
  constructor(readonly username: string) {}
}
