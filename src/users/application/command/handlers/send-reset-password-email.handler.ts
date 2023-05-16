import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SuccessDto } from '@/auth/interface/dto/success.dto';
import { SendResetPasswordEmailCommand } from '@/users/application/command/impl/send-reset-password-email.command';
import { IUserRepository } from '@/users/domain/iuser.repository';

@Injectable()
@CommandHandler(SendResetPasswordEmailCommand)
export class SendResetPasswordEmailHandler
  implements ICommandHandler<SendResetPasswordEmailCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: SendResetPasswordEmailCommand): Promise<SuccessDto> {
    try {
      const result = await this.userRepository.sendResetPasswordToken(
        command.email,
      );
      if (result.affected) return { success: true };
    } catch (err) {
      throw new BadRequestException('Cannot change email');
    }
  }
}
