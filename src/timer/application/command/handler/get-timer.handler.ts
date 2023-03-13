import { GetTimerCommand }    from '@/timer/application/command/impl/get-timer.command';
import { ITimerRepository }   from '@/timer/domain/itimer.repository';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@Injectable()
@CommandHandler(GetTimerCommand)
export class GetTimerHandler implements ICommandHandler<GetTimerCommand> {
  constructor(
    @Inject('TimerRepository')
    private timerRepository: ITimerRepository,
  ) {}
  async execute(command: GetTimerCommand) {
    const { id } = command;

    return await this.timerRepository.fetchTimer(id);
  }
}
