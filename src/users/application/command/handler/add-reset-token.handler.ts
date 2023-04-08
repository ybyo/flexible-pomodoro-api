import { AuthService } from '@/auth/auth.service';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { AddResetTokenCommand } from '@/users/application/command/impl/add-reset-token.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@Injectable()
@CommandHandler(AddResetTokenCommand)
export class AddResetTokenHandler
  implements ICommandHandler<AddResetTokenCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async execute(command: AddResetTokenCommand) {
    const { email, resetPasswordVerifyToken } = command;

    const user = await this.userRepository.findByEmail(email);

    const response = {} as IRes<IUser>;

    if (user === null) {
      response.success = false;
      response.message = 'No user found with the matching email';
      return response;
    } else {
      await this.userRepository.updateUser(
        { email },
        { resetPasswordToken: resetPasswordVerifyToken },
      );
    }

    response.success = true;
    response.message = 'The password reset token has been successfully set';

    return response;
  }
}
