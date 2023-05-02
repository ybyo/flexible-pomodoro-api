import { IQuery } from '@nestjs/cqrs';

export class CheckTokenValidityQuery implements IQuery {
  constructor(readonly field: string, readonly token: string) {}
}
