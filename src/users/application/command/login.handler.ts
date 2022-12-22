import { verifyPassword } from '../../../utilities/password-util';
import { LoginCommand } from './login.command';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from 'src/users/domain/repository/iuser.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async execute(command: LoginCommand) {
    const { email, password } = command;
    const user = await this.userRepository.findByEmail(email);

    const storedPassword = user.getPassword();
    const isValid = await verifyPassword(storedPassword, password);

    if (!isValid) {
      throw new NotFoundException('일치하는 계정 정보가 없습니다.');
    }

    return this.authService.login({
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
    });
  }
}
