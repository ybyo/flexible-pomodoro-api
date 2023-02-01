import { IGeneralResponse } from '@/type-defs/message.interface';
import { Stacks } from '@/stacks/domain/stacks.model';

export interface IStacksRepository {
  fetchStack: (id: string) => Promise<Stacks[]>;
  saveStack: (id: string, stacks: Stacks) => Promise<IGeneralResponse<void>>;
}
