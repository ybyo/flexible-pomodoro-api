import { IQuery } from '@nestjs/cqrs';

export class GetUserByIdQry implements IQuery {
  constructor(readonly id: string) {}
}
