import { IQuery } from '@nestjs/cqrs';

export class GetUserByUserIdQuery implements IQuery {
  constructor(readonly id: string) {}
}
