import { Frag } from '@/frags/domain/frag.model';

export interface IFragRepository {
  fetchFrag: (id: string) => Promise<Frag[]>;
}
