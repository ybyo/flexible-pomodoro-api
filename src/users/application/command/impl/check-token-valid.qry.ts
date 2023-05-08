import { IQuery } from '@nestjs/cqrs';

export class CheckTokenValidQry implements IQuery {
  constructor(readonly column: string, readonly token: string) {}
}
