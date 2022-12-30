import { ulid } from 'ulid';
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';
import { UserFactory } from '../../domain/user.factory';
import { IUserRepository } from '../../domain/repository/iuser.repository';
import { User } from '../../domain/user';

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private userFactory: UserFactory,
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand) {
    const { email } = command;

    const user = await this.userRepository.findByEmail(email);
    if (user !== null) {
      throw new UnprocessableEntityException('이미 사용중인 이메일입니다.');
    }

    const newUser = new User({
      ...command,
      uid: ulid(),
      signupVerifyToken: ulid(),
    });

    await this.userRepository.saveUser(newUser);

    this.userFactory.create(newUser);
  }
}
