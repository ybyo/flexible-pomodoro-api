import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ulid } from 'ulid';

import { AuthService } from '@/auth/auth.service';
import { RegisterUserCommand } from '@/auth/command/impl/register-user.command';
import { RedisService } from '@/redis/redis.service';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { UserFactory } from '@/users/domain/user.factory';
import { User } from '@/users/domain/user.model';
import { UserRegisterEvent } from '@/users/domain/user-register.event';

@Injectable()
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private userFactory: UserFactory,
    @Inject('UserRepository') private userRepository: IUserRepository,
    private redisService: RedisService,
    private authService: AuthService,
    private eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { userName, email, password } = command;

    const user = await this.userRepository.findByEmail(email);
    if (user !== null) throw new BadRequestException('Duplicate email');

    const newUserId = ulid();
    const signupVerifyToken = ulid();

    const newUser = new User({
      ...command,
      id: newUserId,
      signupVerifyToken,
    });

    // Redis token
    try {
      await this.redisService.setValue(
        `signupVerifyToken:${signupVerifyToken}`,
        '1',
        3 * 60 * 60,
      );
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to save token in redis',
        err,
      );
    }

    try {
      await this.userRepository.saveUser(newUser);
    } catch (err) {
      throw new InternalServerErrorException('Failed to save user', err);
    }

    // Send verification email
    try {
      await this.eventBus.publish(
        new UserRegisterEvent(newUser.email, newUser.signupVerifyToken),
      );
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to send verification email',
        err,
      );
    }

    return {
      id: newUser.id,
      userName: newUser.userName,
      email: newUser.email,
    };
  }
}
