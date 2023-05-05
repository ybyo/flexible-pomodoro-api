import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { RedisTokenService } from '@/redis/redis-token.service';
import { AddTokenToDBCmd } from '@/users/application/command/impl/add-token-to-db.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(AddTokenToDBCmd)
export class AddTokenToDBHandler implements ICommandHandler<AddTokenToDBCmd> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private redisService: RedisTokenService,
  ) {}

  async execute(command: AddTokenToDBCmd): Promise<IRes<any>> {
    const { email, event, token } = command;
    const user = await this.userRepository.findByEmail(email);
    const tokenLifetime = 1 * 60 * 60;

    if (user !== null) {
      await this.userRepository.updateUser({ email }, { [event]: token });
      await this.redisService.setValue(`${event}:${token}`, '1', tokenLifetime);

      return {
        success: true,
        message: `The ${event} has been set successfully`,
      };
    }

    throw new BadRequestException('Cannot resend signup email');
  }
}
