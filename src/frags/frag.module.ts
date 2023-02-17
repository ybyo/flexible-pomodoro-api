import { Logger, Module } from '@nestjs/common';
import { FragController } from '@/frags/interface/frag.controller';
import { FragProfile } from '@/frags/common/mapper/frag.profile';
import { AuthModule } from '@/auth/auth.module';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import { FragRepository } from '@/frags/infra/db/repository/frag.repository';
import { GetFragsHandler } from '@/frags/application/command/handler/get-frags.handler';
import { SaveFragHandler } from '@/frags/application/command/handler/save-frag.handler';
import { StacksToFragEntity } from '@/stacks/infra/db/entity/stacks-to-frag.entity';

const commandHandlers = [GetFragsHandler, SaveFragHandler];
const queryHandlers = [];
const eventHandlers = [];
const factories = [];

const repositories = [{ provide: 'FragRepository', useClass: FragRepository }];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    TypeOrmModule.forFeature([FragEntity, StacksToFragEntity]),
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [FragController],
  providers: [
    FragProfile,
    Logger,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    ...factories,
    ...repositories,
  ],
})
export class FragModule {}
