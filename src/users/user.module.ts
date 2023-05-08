import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/auth/auth.module';
import { CheckEmailDupHandler } from '@/auth/command/handler/check-email-dup.handler';
import { EmailModule } from '@/email/email.module';
import { RedisModule } from '@/redis';
import { RedisTokenService } from '@/redis/redis-token.service';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { RoutineRepository } from '@/routines/infra/db/repository/routine-repository.service';
import { ChangeEmailHandler } from '@/users/application/command/handler/change-email.handler';
import { ChangeNameHandler } from '@/users/application/command/handler/change-name.handler';
import { CheckTokenValidityHandler } from '@/users/application/command/handler/check-token-validity.handler';
import { CreateTimestampHandler } from '@/users/application/command/handler/create-timestamp.handler';
import { DeleteAccountHandler } from '@/users/application/command/handler/delete-account.handler';
import { VerifyChangeEmailHandler } from '@/users/application/command/handler/verify-change-email.handler';
import { VerifyResetPasswordTokenHandler } from '@/users/application/command/handler/verify-reset-password-token.handler';
import { UserProfile } from '@/users/common/mapper/user.profile';
import { PasswordResetStrategy } from '@/users/common/strategy/password-reset.strategy';
import { RedisTokenStrategy } from '@/users/common/strategy/redis-token.strategy';

import { UserFactory } from './domain/user.factory';
import { EmailService } from './infra/adapter/email.service';
import { UserEntity } from './infra/db/entity/user.entity';
import { UserRepository } from './infra/db/repository/user.repository';
import { UserController } from './interface/user.controller';

const commandHandlers = [
  ChangeEmailHandler,
  ChangeNameHandler,
  CheckEmailDupHandler,
  CreateTimestampHandler,
  DeleteAccountHandler,
  VerifyChangeEmailHandler,
  VerifyResetPasswordTokenHandler,
];
const queryHandlers = [CheckTokenValidityHandler];
const eventHandlers = [];
const factories = [UserFactory];

const strategies = [PasswordResetStrategy, RedisTokenStrategy];

const externalService = [
  { provide: 'EmailService', useClass: EmailService },
  { provide: 'RedisTokenService', useClass: RedisTokenService },
];

const repositories = [
  { provide: 'RoutineRepository', useClass: RoutineRepository },
  { provide: 'UserRepository', useClass: UserRepository },
];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    EmailModule,
    RedisModule,
    TypeOrmModule.forFeature([UserEntity, RoutineEntity, RoutineToTimerEntity]),
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [UserController],
  providers: [
    ...commandHandlers,
    ...eventHandlers,
    ...externalService,
    ...factories,
    ...queryHandlers,
    ...repositories,
    ...strategies,
    Logger,
    UserProfile,
  ],
})
export class UserModule {}
