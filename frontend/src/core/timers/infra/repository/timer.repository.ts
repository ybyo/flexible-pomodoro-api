import { ITimerRepository } from 'src/core/timers/domain/itimer.repository';
import { Timer } from 'src/core/timers/domain/timer.model';

export class TimerRepository implements ITimerRepository {
  // carStore = useCarStore();

  async getTimetimerByUserId(userId: string): Promise<void> {
    // return this.carStore.fetchAll(userId);
  }

  async saveTimetimer(car: Timer): Promise<void> {
    return Promise.resolve(undefined);
  }

  async editTimetimer(criteria: object, partialEntity: object): Promise<void> {
    return Promise.resolve(undefined);
  }
}
