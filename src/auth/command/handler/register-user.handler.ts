import { ulid } from 'ulid';
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
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
      throw new UnprocessableEntityException('이미 사용중인 이메일입니다.');
    }

    // TODO: userId, signupVerifyToken 등이 undefined일 때, 자동으로 값 부여하도록 구현
    const newUser = new User({
      ...command,
      userId: ulid(),
      signupVerifyToken: ulid(),
    });

    await this.userRepository.saveUser(newUser);

    this.userFactory.create(newUser);

    return {
      userId: newUser.userId,
      userName: newUser.userName,
      email: newUser.email,
    };
  }
}
