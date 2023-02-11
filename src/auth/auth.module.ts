import { AuthController } from '@/auth/auth.controller';
import { AuthSerializer } from '@/auth/serialization.provider';
import { AuthService } from './auth.service';
import { CqrsModule } from '@nestjs/cqrs';
import { GetUserByUserIdHandler } from '@/auth/query/handler/get-user-by-userid.handler';
import { Logger, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RegisterUserHandler } from '@/auth/command/handler/register-user.handler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserFactory } from '@/users/domain/user.factory';
import { UserRepository } from '@/users/infra/db/repository/UserRepository';
import { ValidateUserHandler } from '@/auth/command/handler/validate-user.handler';
import { JwtStrategy } from '@/auth/strategy/jwt.strategy';
import { LocalStrategy } from '@/auth/strategy/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { jwtExpConfig } from '@/config/jwtConfig';
import { CheckEmailHandler } from '@/auth/command/handler/check-email.handler';

const CommandHandlers = [
  ValidateUserHandler,
  RegisterUserHandler,
  CheckEmailHandler,
];
const QueryHandlers = [GetUserByUserIdHandler];
const EventHandlers = [];

const repositories = [{ provide: 'UserRepository', useClass: UserRepository }];
const factories = [UserFactory];

const strategies = [LocalStrategy, JwtStrategy];

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ session: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: jwtExpConfig,
    }),
    TypeOrmModule.forFeature([UserEntity]),
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
