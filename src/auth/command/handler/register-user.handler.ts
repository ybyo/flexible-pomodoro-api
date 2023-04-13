import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ulid } from 'ulid';

import { RegisterUserCommand } from '@/auth/command/impl/register-user.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { UserFactory } from '@/users/domain/user.factory';
import { User } from '@/users/domain/user.model';

@Injectable()
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private userFactory: UserFactory,
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { email } = command;
    const user = await this.userRepository.findByEmail(email);
    if (user !== null) throw new BadRequestException('Duplicate email');
    const newUser = new User({
      ...command,
      id: ulid(),
      signupVerifyToken: ulid(),
    });

    try {
      await this.userRepository.saveUser(newUser);
    } catch (err) {
      throw new InternalServerErrorException('Failed to save user', err);
    }

    await this.userFactory.create(newUser);

    return {
      id: newUser.id,
      userName: newUser.userName,
      email: newUser.email,
    };
  }
}
