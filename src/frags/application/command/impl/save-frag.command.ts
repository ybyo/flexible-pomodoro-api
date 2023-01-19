import { ICommand } from '@nestjs/cqrs';
import { Frag } from '@/frags/domain/frag.model';

export class SaveFragCommand implements ICommand {
  constructor(readonly id: string, readonly frags: Frag[]) {}
}
