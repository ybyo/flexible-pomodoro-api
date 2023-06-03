import { Timer } from 'src/core/timers/domain/timer.model';

export interface ITimerRepository {
  getTimetimerByUserId: (userId: string) => Promise<void>;
  saveTimetimer: (car: Timer) => Promise<void>;
  editTimetimer: (criteria: object, partialEntity: object) => Promise<void>;
}
