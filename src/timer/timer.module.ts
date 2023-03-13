import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';
import { Logger, Module }      from '@nestjs/common';
import { TimerController }     from '@/timer/interface/timer.controller';
import { TimerProfile }        from '@/timer/common/mapper/timer.profile';
import { AuthModule }          from '@/auth/auth.module';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule }      from '@nestjs/passport';
import { TimerEntity }         from '@/timer/infra/db/entity/timer.entity';
import { TimerRepository }     from '@/timer/infra/db/repository/timer.repository';
import { GetTimerHandler }     from '@/timer/application/command/handler/get-timer.handler';
import { SaveTimerHandler }    from '@/timer/application/command/handler/save-timer.handler';
import { StacksToTimerEntity } from '@/stacks/infra/db/entity/stacks-to-timer.entity';

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
    TypeOrmModule.forFeature([TimerEntity, StacksToTimerEntity, StacksEntity]),
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
