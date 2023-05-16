import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SuccessDto } from '@/auth/interface/dto/success.dto';
import { DeleteAccountCommand } from '@/users/application/command/impl/delete-account.command';
import { IUserRepository } from '@/users/domain/iuser.repository';

@Injectable()
@CommandHandler(DeleteAccountCommand)
export class DeleteAccountHandler
  implements ICommandHandler<DeleteAccountCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private logger: Logger,
  ) {}

  async execute(command: DeleteAccountCommand): Promise<SuccessDto> {
    try {
      const result = await this.userRepository.deleteUser(command.id);
      if (result.affected) return { success: true };
    } catch (err) {
      this.logger.log(err);
      throw new InternalServerErrorException('Cannot delete user');
    }
  }
}
