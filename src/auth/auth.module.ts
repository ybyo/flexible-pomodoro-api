import { AuthController } from '@/auth/auth.controller';
import { AuthSerializer } from '@/auth/serialization.provider';
import { AuthService } from './auth.service';
import { CqrsModule } from '@nestjs/cqrs';
import { GetUserByUserIdHandler } from '@/auth/query/handler/get-user-by-userid.handler';
import {
  Logger,
  Module,
} from '@nestjs/common';
import { LocalStrategy } from '@/auth/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { RegisterUserHandler } from '@/auth/command/handler/register-user.handler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserFactory } from '@/users/domain/user.factory';
import { UserRepository } from '@/users/infra/db/repository/UserRepository';
import { ValidateUserHandler } from '@/auth/command/handler/validate-user.handler';

export const CommandHandlers = [ValidateUserHandler, RegisterUserHandler];
export const QueryHandlers = [GetUserByUserIdHandler];
export const EventHandlers = [];

const repositories = [{ provide: 'UserRepository', useClass: UserRepository }];

const factories = [UserFactory];

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ session: true }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AuthController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    ...factories,
    ...repositories,
    AuthSerializer,
    LocalStrategy,
    AuthService,
    Logger,
  ],
  exports: [AuthService],
})
export class AuthModule {}
