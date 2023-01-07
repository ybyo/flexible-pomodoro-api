import { Logger, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CqrsModule } from '@nestjs/cqrs';
import { EmailModule } from 'src/email/email.module';
import { EmailService } from './infra/adapter/email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infra/db/entity/user.entity';
import { UserEventsHandler } from './application/event/user-events.handler';
import { UserFactory } from './domain/user.factory';
import { UserRepository } from './infra/db/repository/UserRepository';
import { UsersController } from './interface/users.controller';
import { UserProfile } from '@/users/common/mapper/user.profile';
import { VerifyEmailHandler } from '@/users/application/command/handler/verify-email.handler';
import { PassportModule } from '@nestjs/passport';

const commandHandlers = [VerifyEmailHandler];
const queryHandlers = [];
const eventHandlers = [UserEventsHandler];
const factories = [UserFactory];

const repositories = [
  { provide: 'UserRepository', useClass: UserRepository },
  { provide: 'EmailService', useClass: EmailService },
];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    EmailModule,
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [UsersController],
  providers: [
    Logger,
    UserProfile,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    ...factories,
    ...repositories,
  ],
})
export class UsersModule {}

// export class UsersModule implements NestModule {
//   constructor(@Inject(REDIS) private readonly redis: RedisClient) {}
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(
//         session({
//           store: new (RedisStore(session))({
//             client: this.redis,
//             logErrors: true,
//           }),
//           saveUninitialized: false,
//           // TODO: secret 변경, cookie 옵션 일치시키기
//           secret: 'sup3rs3cr3t',
//           resave: false,
//           cookie: {
//             sameSite: true,
//             httpOnly: false,
//             maxAge: 60000,
//           },
//         }),
//         // Must be called before `passport.session()`
//         passport.initialize(),
//         passport.session(),
//       )
//       .forRoutes('*');
//   }
// }
