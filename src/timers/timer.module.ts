import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { Logger, Module } from '@nestjs/common';
import { TimerController } from '@/timers/interface/timer.controller';
import { TimerProfile } from '@/timers/common/mapper/timer.profile';
import { AuthModule } from '@/auth/auth.module';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { TimerEntity } from '@/timers/infra/db/entity/timer.entity';
import { TimerRepository } from '@/timers/infra/db/repository/timer.repository';
import { GetTimerHandler } from '@/timers/application/command/handler/get-timer.handler';
import { SaveTimerHandler } from '@/timers/application/command/handler/save-timer.handler';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';

const commandHandlers = [GetTimerHandler, SaveTimerHandler];
const queryHandlers = [];
const eventHandlers = [];
const factories = [];

const repositories = [
  { provide: 'TimerRepository', useClass: TimerRepository },
];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    TypeOrmModule.forFeature([
      TimerEntity,
      RoutineToTimerEntity,
      RoutineEntity,
    ]),
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [TimerController],
  providers: [
    TimerProfile,
    Logger,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    ...factories,
    ...repositories,
  ],
})
export class TimerModule {}
