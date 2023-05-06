import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthService } from '@/auth/auth.service';
import { UpdatePasswordCmd } from '@/users/application/command/impl/update-password.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(UpdatePasswordCmd)
export class UpdatePasswordHandler
  implements ICommandHandler<UpdatePasswordCmd>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async execute(cmd: UpdatePasswordCmd) {
    const { token, newPassword } = cmd;
    const result = await this.authService.verifyJWT(token);

    if (result.success) {
      await this.userRepository.updateUser(
        { email: result.data.email },
        { password: newPassword, resetPasswordToken: null },
      );

      return { success: true };
    }

    throw new InternalServerErrorException('Cannot update password');
  }
}
