import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import Redis from 'ioredis';
import { UpdateResult } from 'typeorm';

import { REDIS_SUB } from '@/redis/redis.constants';
import { DeleteAccountCommand } from '@/users/application/command/impl/delete-account.command';
import { IUserRepository } from '@/users/domain/iuser.repository';

@Injectable()
export class RedisTokenSubsService {
  constructor(
    private commandBus: CommandBus,
    @Inject(REDIS_SUB) private redisClient: Redis,
    @Inject('UserRepository') private userRepository: IUserRepository,
    private logger: Logger,
  ) {
    const client = this.runRedisTokenPub();
    this.runRedisTokenSub(client);
  }

  private runRedisTokenPub(): Redis {
    const client = new Redis({
      port: +process.env.REDIS_PORT,
      host: process.env.REDIS_URL,
    });

    if (process.env.NODE_ENV === 'development') {
      client.config('SET', 'notify-keyspace-events', 'AKE');
    }

    return client;
  }

  private runRedisTokenSub(client: Redis): void {
    client.subscribe('__keyevent@0__:expired');
    client.on('message', async (channel, key): Promise<void> => {
      if (channel === '__keyevent@0__:expired') {
        const event = key.split(':')[0];
        const token = key.split(':')[1];

        try {
          await this.expireToken(
            event,
            token,
            this.userRepository,
            this.commandBus,
          );
        } catch (err) {
          this.logger.error(`Cannot expire token. ${event}:${token}`);
        }
      }
    });
  }

  private async expireToken(
    event: string,
    token: string,
    userRepository: IUserRepository,
    commandBus: CommandBus,
  ): Promise<UpdateResult> {
    const user = await userRepository.findByToken(event, token);

    if (event === 'signupToken') {
      const command = new DeleteAccountCommand(user.id);
      await commandBus.execute(command);
      this.logger.verbose(
        `Unverified user data deleted...\n User email: ${JSON.stringify(
          user.email,
        )}`,
      );
    } else {
      this.logger.verbose(
        `${event} expired...\n User email: ${JSON.stringify(user.email)}`,
      );

      return await userRepository.updateUser(
        { id: user.id },
        { [event]: null },
      );
    }
  }
}
