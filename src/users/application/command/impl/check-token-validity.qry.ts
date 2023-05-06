import { IQuery } from '@nestjs/cqrs';

export class CheckTokenValidityQry implements IQuery {
  constructor(readonly column: string, readonly token: string) {}
}
