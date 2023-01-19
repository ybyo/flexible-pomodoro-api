import { Frag } from '@/frags/domain/frag.model';
import { IGeneralResponse } from '@/type-defs/message.interface';

export interface IFragRepository {
  fetchFrag: (id: string) => Promise<Frag[]>;
  saveFrag: (id: string, frags: Frag[]) => Promise<IGeneralResponse<void>>;
}
