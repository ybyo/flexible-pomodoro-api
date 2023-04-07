import { AuthController } from '@/auth/auth.controller';
import { AuthSerializer } from '@/auth/serialization.provider';
import { AuthService } from './auth.service';
import { CheckEmailHandler } from '@/auth/command/handler/check-email.handler';
import { CqrsModule } from '@nestjs/cqrs';
import { GetUserByUserIdHandler } from '@/auth/query/handler/get-user-by-userid.handler';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@/auth/strategy/jwt.strategy';
import { LocalStrategy } from '@/auth/strategy/local.strategy';
import { Logger, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RegisterUserHandler } from '@/auth/command/handler/register-user.handler';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineRepository } from '@/routines/infra/db/repository/routine-repository.service';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserFactory } from '@/users/domain/user.factory';
import { UserRepository } from '@/users/infra/db/repository/UserRepository';
import { ValidateUserHandler } from '@/auth/command/handler/validate-user.handler';
import { jwtExpConfig } from '@/config/jwtConfig';

const CommandHandlers = [
  CheckEmailHandler,
  RegisterUserHandler,
  ValidateUserHandler,
];
const QueryHandlers = [GetUserByUserIdHandler];
const EventHandlers = [];

const repositories = [
  { provide: 'RoutineRepository', useClass: RoutineRepository },
  { provide: 'UserRepository', useClass: UserRepository },
];
const factories = [UserFactory];

const strategies = [LocalStrategy, JwtStrategy];

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ session: true }),
    TypeOrmModule.forFeature([UserEntity, RoutineEntity, RoutineToTimerEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: jwtExpConfig,
    }),
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
