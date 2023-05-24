import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SuccessDto } from '@/auth/interface/dto/success.dto';
import { SendChangeEmailTokenCommand } from '@/users/application/command/impl/send-change-email-token.command';
import { IUserRepository } from '@/users/domain/iuser.repository';

@Injectable()
@CommandHandler(SendChangeEmailTokenCommand)
export class SendChangeEmailTokenHandler
  implements ICommandHandler<SendChangeEmailTokenCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: SendChangeEmailTokenCommand): Promise<SuccessDto> {
    try {
      const result = await this.userRepository.sendChangeEmailToken(
        command.oldEmail,
        command.newEmail,
      );

      return { success: !!result.affected };
    } catch (err) {
      throw new BadRequestException('Cannot change email');
    }
  }
}
