import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { RedisService } from '@/redis/redis.service';
import { AddTokenToDBCmd } from '@/users/application/command/impl/add-token-to-db.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(AddTokenToDBCmd)
export class AddTokenToDBHandler implements ICommandHandler<AddTokenToDBCmd> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private redisService: RedisService,
  ) {}

  async execute(command: AddTokenToDBCmd): Promise<IRes<any>> {
    const { email, event, token } = command;

    const user = await this.userRepository.findByEmail(email);

    if (user !== null) {
      await this.userRepository.updateUser({ email }, { [event]: token });
      await this.redisService.setValue(
        `${event}:${token}`,
        user.id,
        1 * 60 * 60,
      );

      return {
        success: true,
        message: 'The password reset token has been successfully set',
      };
    }

    return {
      success: false,
      message: 'No user found with the matching email',
    };
  }
}
