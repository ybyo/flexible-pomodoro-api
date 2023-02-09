import { Frag } from '@/frags/domain/frag.model';
import { IRes } from '@/type-defs/message.interface';

export interface IFragRepository {
  fetchFrag: (id: string) => Promise<Frag[]>;
  saveFrag: (id: string, frags: Frag[]) => Promise<IRes<void>>;
}
