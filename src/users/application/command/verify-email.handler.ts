import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyEmailCommand } from './verify-email.command';
import { AuthService } from '../../../auth/auth.service';
import { IUserRepository } from '../../domain/repository/iuser.repository';

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async execute(command: VerifyEmailCommand) {
    const { signupVerifyToken } = command;

    const user = await this.userRepository.findBySignupVerifyToken(
      signupVerifyToken,
    );
    if (user === null) {
      throw new UnprocessableEntityException(
        'Invalid sign up email authentication.',
      );
    }

    return this.authService.login({
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
    });
  }
}
