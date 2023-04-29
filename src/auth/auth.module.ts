import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from '@/auth/auth.controller';
import { CheckEmailDupHandler } from '@/auth/command/handler/check-email-dup.handler';
import { RegisterUserHandler } from '@/auth/command/handler/register-user.handler';
import { ValidateUserHandler } from '@/auth/command/handler/validate-user.handler';
import { CheckDuplicateUsernameHandler } from '@/auth/query/handler/check-duplicate-username.handler';
import { GetUserByUserIdHandler } from '@/auth/query/handler/get-user-by-userid.handler';
import { AuthSerializer } from '@/auth/serialization.provider';
import { JwtStrategy } from '@/auth/strategy/jwt.strategy';
import { LocalStrategy } from '@/auth/strategy/local.strategy';
import { jwtExpConfig } from '@/config/jwtConfig';
import { EmailModule } from '@/email/email.module';
import { RedisModule } from '@/redis';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { RoutineRepository } from '@/routines/infra/db/repository/routine-repository.service';
import { UserFactory } from '@/users/domain/user.factory';
import { EmailService } from '@/users/infra/adapter/email.service';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserRepository } from '@/users/infra/db/repository/user.repository';

import { AuthService } from './auth.service';

const CommandHandlers = [
  CheckEmailDupHandler,
  RegisterUserHandler,
  ValidateUserHandler,
];
const QueryHandlers = [GetUserByUserIdHandler, CheckDuplicateUsernameHandler];
const EventHandlers = [];

const repositories = [
  { provide: 'EmailService', useClass: EmailService },
  { provide: 'RoutineRepository', useClass: RoutineRepository },
  { provide: 'UserRepository', useClass: UserRepository },
];
const factories = [UserFactory];
const strategies = [LocalStrategy, JwtStrategy];

@Module({
  imports: [
    CqrsModule,
    EmailModule,
    PassportModule.register({ session: true }),
    TypeOrmModule.forFeature([UserEntity, RoutineEntity, RoutineToTimerEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: jwtExpConfig,
    }),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    ...factories,
    ...repositories,
    ...strategies,
    AuthSerializer,
    AuthService,
    Logger,
  ],
  exports: [AuthService],
})
export class AuthModule {}
