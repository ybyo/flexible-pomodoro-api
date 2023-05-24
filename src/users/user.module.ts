import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from '@/auth/application/auth.service';
import { ResendEmailHandler } from '@/auth/application/command/handlers/resend-email.handler';
import { CheckDuplicateEmailHandler } from '@/auth/application/query/handlers/check-duplicate-email.handler';
import { AuthModule } from '@/auth/auth.module';
import { EmailModule } from '@/email/email.module';
import { RedisModule } from '@/redis/redis.module';
import { RedisTokenService } from '@/redis/redis-token.service';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { RoutineRepository } from '@/routines/infra/db/repository/routine.repository';
import { ChangeNameHandler } from '@/users/application/command/handlers/change-name.handler';
import { DeleteUserHandler } from '@/users/application/command/handlers/delete-user.handler';
import { SendChangeEmailTokenHandler } from '@/users/application/command/handlers/send-change-email-token.handler';
import { SendResetPasswordEmailHandler } from '@/users/application/command/handlers/send-reset-password-email.handler';
import { VerifyChangeEmailTokenHandler } from '@/users/application/command/handlers/verify-change-email-token-handler';
import { VerifyResetPasswordTokenHandler } from '@/users/application/command/handlers/verify-reset-password-token.handler';
import { CheckResetPasswordTokenValidityHandler } from '@/users/application/query/handlers/check-reset-password-token-validity.handler';
import { CheckSignupTokenValidityHandler } from '@/users/application/query/handlers/check-signup-token-validity.handler';
import { UserFactory } from '@/users/domain/user.factory';
import { UserProfile } from '@/users/helper/mapper/user.profile';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserRepository } from '@/users/infra/db/repository/user.repository';
import { PasswordResetStrategy } from '@/users/interface/strategy/password-reset.strategy';
import { RedisTokenStrategy } from '@/users/interface/strategy/redis-token.strategy';
import { UserController } from '@/users/interface/user.controller';

import { EmailService } from './infra/adapter/email.service';

const commandHandlers = [
  ChangeNameHandler,
  CheckDuplicateEmailHandler,
  DeleteUserHandler,
  ResendEmailHandler,
  SendChangeEmailTokenHandler,
  SendResetPasswordEmailHandler,
  VerifyChangeEmailTokenHandler,
  VerifyResetPasswordTokenHandler,
  CheckResetPasswordTokenValidityHandler,
];
const queryHandlers = [CheckSignupTokenValidityHandler];

const strategies = [PasswordResetStrategy, RedisTokenStrategy];

const externalService = [
  { provide: 'EmailService', useClass: EmailService },
  { provide: 'RedisTokenService', useClass: RedisTokenService },
];

const repositories = [
  { provide: 'RoutineRepository', useClass: RoutineRepository },
  { provide: 'UserRepository', useClass: UserRepository },
];

const factories = [UserFactory];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    EmailModule,
    RedisModule,
    TypeOrmModule.forFeature([UserEntity, RoutineEntity, RoutineToTimerEntity]),
  ],
  controllers: [UserController],
  providers: [
    ...commandHandlers,
    ...externalService,
    ...factories,
    ...queryHandlers,
    ...repositories,
    ...strategies,
    AuthService,
    Logger,
    UserProfile,
    RedisTokenStrategy,
  ],
})
export class UserModule {}
