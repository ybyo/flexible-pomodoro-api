import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { VerifyChangeEmailTokenCommand } from '@/users/application/command/impl/verify-change-email-token.command';
import { IUserRepository } from '@/users/domain/iuser.repository';

@Injectable()
@CommandHandler(VerifyChangeEmailTokenCommand)
export class VerifyChangeEmailTokenHandler
  implements ICommandHandler<VerifyChangeEmailTokenCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}
  async execute(command: VerifyChangeEmailTokenCommand) {
    const user = await this.userRepository.findByChangeEmailToken(
      command.changeEmailToken,
    );

    if (user !== null) {
      const result = await this.userRepository.changeEmail(
        user.id,
        user.newEmail,
        command.changeEmailToken,
      );
      if (result.affected) {
        return {
          success: true,
          data: {
            id: user.id,
            email: user.newEmail,
            name: user.name,
          },
        };
      }
    }

    throw new BadRequestException('Cannot verify change email token');
  }
}
