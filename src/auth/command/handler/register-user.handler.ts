import { ulid } from 'ulid';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from '@/users/domain/user.model';
import { UserFactory } from '@/users/domain/user.factory';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { RegisterUserCommand } from '@/auth/command/impl/register-user.command';

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
    if (user !== null) {
      throw new BadRequestException('Duplicate email');
    }

    // TODO: id, signupVerifyToken 등이 undefined 일 때, 자동으로 값 부여하도록 구현
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
