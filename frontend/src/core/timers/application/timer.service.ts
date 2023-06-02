import { ITimerRepository } from 'src/core/timers/domain/itimer.repository';
import { Timer } from 'src/core/timers/domain/timer.model';

export class TimerService {
  constructor(
    protected car: Timer,
    protected timetimerRepository: ITimerRepository
  ) {}

  async createTimetimer(car: Timer) {
    await this.timetimerRepository.saveTimetimer(car);
  }

  // TODO: show CarSet 추가

  async findCarByUserId() {
    return;
  }

  async findCarByCarName() {
    return;
  }

  async editCarName() {
    return;
  }

  async editCarColor() {
    return;
  }

  async editCarDuration() {
    return;
  }
}
