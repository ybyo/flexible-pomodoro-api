import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import Redis from 'ioredis';

import { REDIS } from '@/redis/redis.constants';
import { DeleteAccountCmd } from '@/users/application/command/impl/delete-account.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
export class RedisTokenListeningService {
  constructor(
    private commandBus: CommandBus,
    @Inject(REDIS) private redisClient: Redis,
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {
    // Add new Redis client for listening event
    const listenClient = new Redis({
      port: +process.env.REDIS_PORT,
      host: process.env.REDIS_URL,
    });

    if (process.env.NODE_ENV === 'development') {
      listenClient.config('SET', 'notify-keyspace-events', 'AKE');
    }
    listenClient.subscribe('__keyevent@0__:expired');
    listenClient.on('message', async (channel, key): Promise<void> => {
      if (channel === '__keyevent@0__:expired') {
        const event = key.split(':')[0];
        const token = key.split(':')[1];

        if (event === 'signupToken' || event === 'resetPasswordToken') {
          try {
            await this.expireToken(
              this.userRepository,
              this.commandBus,
              token,
              event,
            );
          } catch (err) {
            console.log(err);
          }
        } else {
          throw new InternalServerErrorException(
            `Unexpected event type: ${event}`,
          );
        }
      }
    });
  }

  private async expireToken(
    userRepository: IUserRepository,
    commandBus: CommandBus,
    token: string,
    event: string,
  ): Promise<void> {
    const user = await userRepository.findByToken(event, token);

    if (user) {
      if (event === 'signupToken') {
        const command = new DeleteAccountCmd(user.id);
        await commandBus.execute(command);
        console.log(
          `Unverified user data deleted...\n User email: ${JSON.stringify(
            user.email,
          )}`,
        );
      } else {
        await userRepository.updateUser({ id: user.id }, { [event]: null });
        console.log(
          `${event} expired...\n User email: ${JSON.stringify(user.email)}`,
        );
      }
    }
  }
}
