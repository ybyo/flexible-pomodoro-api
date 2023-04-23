import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { EmailModule } from 'src/email/email.module';

import { CheckEmailDupHandler } from '@/auth/command/handler/check-email-dup.handler';
import { RedisModule } from '@/redis';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { RoutineRepository } from '@/routines/infra/db/repository/routine-repository.service';
import { AddTokenToDBHandler } from '@/users/application/command/handler/add-token-to-db.handler';
import { ChangeEmailHandler } from '@/users/application/command/handler/change-email.handler';
import { ChangeNameHandler } from '@/users/application/command/handler/change-name.handler';
import { CreateTimestampHandler } from '@/users/application/command/handler/create-timestamp.handler';
import { DeleteAccountHandler } from '@/users/application/command/handler/delete-account.handler';
import { UpdatePasswordHandler } from '@/users/application/command/handler/update-password.handler';
import { VerifyChangeEmailHandler } from '@/users/application/command/handler/verify-change-email.handler';
import { VerifyEmailHandler } from '@/users/application/command/handler/verify-email.handler';
import { VerifyResetPasswordTokenHandler } from '@/users/application/command/handler/verify-reset-password-token.handler';
import { UserProfile } from '@/users/common/mapper/user.profile';
import { PasswordResetStrategy } from '@/users/common/strategy/password-reset.strategy';
import { RedisTokenStrategy } from '@/users/common/strategy/redis-token.strategy';

import { UserRegisterEventHandler } from './application/event/user-register-event.handler';
import { UserFactory } from './domain/user.factory';
import { EmailService } from './infra/adapter/email.service';
import { UserEntity } from './infra/db/entity/user.entity';
import { UserRepository } from './infra/db/repository/user.repository';
import { UserController } from './interface/user.controller';

const commandHandlers = [
  AddTokenToDBHandler,
  ChangeEmailHandler,
  ChangeNameHandler,
  CheckEmailDupHandler,
  CreateTimestampHandler,
  DeleteAccountHandler,
  UpdatePasswordHandler,
  VerifyChangeEmailHandler,
  VerifyEmailHandler,
  VerifyResetPasswordTokenHandler,
];
const queryHandlers = [];
const eventHandlers = [UserRegisterEventHandler];
const factories = [UserFactory];

const strategies = [PasswordResetStrategy, RedisTokenStrategy];

const repositories = [
  { provide: 'EmailService', useClass: EmailService },
  { provide: 'RoutineRepository', useClass: RoutineRepository },
  { provide: 'UserRepository', useClass: UserRepository },
];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    EmailModule,
    TypeOrmModule.forFeature([UserEntity, RoutineEntity, RoutineToTimerEntity]),
    RedisModule,
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [UserController],
  providers: [
    ...commandHandlers,
    ...eventHandlers,
    ...factories,
    ...queryHandlers,
    ...repositories,
    ...strategies,
    Logger,
    UserProfile,
  ],
})
export class UserModule {}
