import { Timer } from '@/timer/domain/timer.model';
import { IRes } from '@/type-defs/message.interface';

export interface ITimerRepository {
  fetchTimer: (id: string) => Promise<Timer[]>;
  saveTimer: (id: string, timer: Timer[]) => Promise<IRes<void>>;
}
