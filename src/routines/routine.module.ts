import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/auth/auth.module';
import { GetRoutineHandler } from '@/routines/application/command/handler/get-routine-handler.service';
import { RemoveRoutineHandler } from '@/routines/application/command/handler/remove-routine-handler.service';
import { SaveRoutineHandler } from '@/routines/application/command/handler/save-routine-handler.service';
import { RoutineProfile } from '@/routines/common/mapper/routine-profile.service';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { RoutineRepository } from '@/routines/infra/db/repository/routine-repository.service';
import { RoutineController } from '@/routines/interface/routine.controller';

const commandHandlers = [
  GetRoutineHandler,
  SaveRoutineHandler,
  RemoveRoutineHandler,
];
const queryHandlers = [];
const eventHandlers = [];
const factories = [];

const repositories = [
  { provide: 'RoutineRepository', useClass: RoutineRepository },
];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    TypeOrmModule.forFeature([RoutineEntity, RoutineToTimerEntity]),
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [RoutineController],
  providers: [
    Logger,
    RoutineProfile,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    ...factories,
    ...repositories,
  ],
})
export class RoutineModule {}
