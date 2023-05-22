import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SuccessDto } from '@/auth/interface/dto/success.dto';
import { ChangeNameCommand } from '@/users/application/command/impl/change-name.command';
import { IUserRepository } from '@/users/domain/iuser.repository';

@Injectable()
@CommandHandler(ChangeNameCommand)
export class ChangeNameHandler implements ICommandHandler<ChangeNameCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private logger: Logger,
  ) {}

  async execute(command: ChangeNameCommand): Promise<SuccessDto> {
    try {
      const result = await this.userRepository.updateUser(
        { email: command.email },
        { name: command.newName },
      );
      return { success: !!result.affected };
    } catch (err) {
      this.logger.error(err);
      throw new BadRequestException('Cannot change username');
    }
  }
}
