import { AuthService } from '@/auth/auth.service';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { ChangeEmailCommand } from '@/users/application/command/impl/change-email.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@Injectable()
@CommandHandler(ChangeEmailCommand)
export class ChangeEmailHandler implements ICommandHandler<ChangeEmailCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async execute(command: ChangeEmailCommand) {
    const { oldEmail, newEmail, changeEmailVerifyToken } = command;

    const user = await this.userRepository.findByEmail(oldEmail);

    const response = {} as IRes<IUser>;

    if (user === null) {
      response.success = false;
      response.message = 'No user found with the matching email';
      return response;
    } else {
      await this.userRepository.updateUser(
        { email: oldEmail },
        { changeEmailToken: changeEmailVerifyToken, newEmail },
      );
    }

    response.success = true;
    response.message = 'The change email token has been successfully set';

    return response;
  }
}
