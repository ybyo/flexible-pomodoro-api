import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { AddResetTokenCmd } from '@/users/application/command/impl/add-reset-token.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(AddResetTokenCmd)
export class AddResetTokenHandler implements ICommandHandler<AddResetTokenCmd> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: AddResetTokenCmd): Promise<IRes<any>> {
    const { email, resetPasswordVerifyToken } = command;

    const user = await this.userRepository.findByEmail(email);

    if (user === null) {
      return {
        success: false,
        message: 'No user found with the matching email',
      };
    } else {
      await this.userRepository.updateUser(
        { email },
        { resetPasswordToken: resetPasswordVerifyToken },
      );
    }

    return {
      success: true,
      message: 'The password reset token has been successfully set',
    };
  }
}
