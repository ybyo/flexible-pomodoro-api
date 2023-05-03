import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ulid } from 'ulid';

import { AuthService } from '@/auth/auth.service';
import { RegisterUserCmd } from '@/auth/command/impl/register-user.cmd';
import { IRes } from '@/customTypes/interfaces/message.interface';
import { RedisTokenService } from '@/redis/redis-token.service';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { UserFactory } from '@/users/domain/user.factory';
import { User } from '@/users/domain/user.model';
import { UserRegisterEvent } from '@/users/domain/user-register.event';

@Injectable()
@CommandHandler(RegisterUserCmd)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCmd> {
  constructor(
    private userFactory: UserFactory,
    @Inject('UserRepository') private userRepository: IUserRepository,
    private redisService: RedisTokenService,
    private authService: AuthService,
    private eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCmd): Promise<IRes> {
    const { email } = command;

    const user = await this.userRepository.findByEmail(email);
    if (user !== null) throw new BadRequestException('Duplicate email');

    const newUserId = ulid();
    const signupToken = ulid();
    const tokenLifetime = 1 * 60 * 60;

    const newUser = new User({
      ...command,
      id: newUserId,
      signupToken,
    });

    await this.redisService.setValue(
      `signupToken:${signupToken}`,
      '1',
      tokenLifetime,
    );
    await this.userRepository.saveUser(newUser);

    // Send verification email
    await this.eventBus.publish(
      new UserRegisterEvent(newUser.email, newUser.signupToken),
    );

    return { success: true };
  }
}
