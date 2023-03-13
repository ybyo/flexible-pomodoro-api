import { StacksRepository } from '@/stacks/infra/db/repository/stacks.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';
import { StacksController } from '@/stacks/interface/stacks.controller';
import { AuthModule } from '@/auth/auth.module';
import { CqrsModule } from '@nestjs/cqrs';
import { PassportModule } from '@nestjs/passport';
import { Logger, Module } from '@nestjs/common';
import { StacksProfile } from '@/stacks/common/mapper/stacks.profile';
import { SaveStacksHandler } from '@/stacks/application/command/handler/save-stacks.handler';
import { GetStacksHandler }    from '@/stacks/application/command/handler/get-stacks.handler';
import { StacksToTimerEntity } from '@/stacks/infra/db/entity/stacks-to-timer.entity';
import { RemoveStacksHandler } from '@/stacks/application/command/handler/remove-stacks.handler';

const commandHandlers = [
  GetStacksHandler,
  SaveStacksHandler,
  RemoveStacksHandler,
];
const queryHandlers = [];
const eventHandlers = [];
const factories = [];

const repositories = [
  { provide: 'StacksRepository', useClass: StacksRepository },
];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    TypeOrmModule.forFeature([StacksEntity, StacksToTimerEntity]),
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [StacksController],
  providers: [
    Logger,
    StacksProfile,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    ...factories,
    ...repositories,
  ],
})
export class StacksModule {}
