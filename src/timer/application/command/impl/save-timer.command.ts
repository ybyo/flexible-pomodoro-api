import { ICommand } from '@nestjs/cqrs';
import { Timer }    from '@/timer/domain/timer.model';

export class SaveTimerCommand implements ICommand {
  constructor(readonly id: string, readonly timer: Timer[]) {}
}
