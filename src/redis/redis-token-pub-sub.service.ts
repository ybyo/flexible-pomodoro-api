import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import Redis from 'ioredis';
import { UpdateResult } from 'typeorm';

import { REDIS_SUB } from '@/redis/redis.constants';
import { DeleteUserCommand } from '@/users/application/command/impl/delete-user.command';
import { IUserRepository } from '@/users/domain/iuser.repository';

@Injectable()
export class RedisTokenPubSubService {
  constructor(
    private commandBus: CommandBus,
    @Inject(REDIS_SUB) private redisClient: Redis,
    @Inject('UserRepository') private userRepository: IUserRepository,
    private logger: Logger,
  ) {
    const tokenList = ['signupToken', 'changeEmailToken', 'resetPasswordToken'];

    const client = this.initRedisTokenSub('Ex');
    this.subRedisToken(client, '__keyevent@0__:expired', tokenList);
  }

  private initRedisTokenSub(option: string): Redis {
    const client = new Redis({
      port: +process.env.REDIS_PORT,
      host: process.env.REDIS_URL,
    });

    if (process.env.NODE_ENV === 'development') {
      client.config('SET', 'notify-keyspace-events', option);
    }

    return client;
  }

  private subRedisToken(
    client: Redis,
    event: string,
    tokenList: string[],
  ): void {
    client.subscribe(event);
    client.on('message', async (channel, key): Promise<void> => {
      if (channel === event) {
        const event = key.split(':')[0];
        const token = key.split(':')[1];

        if (tokenList.includes(event)) {
          try {
            await this.expireToken(event, token);
          } catch (err) {
            this.logger.error(`Cannot expire token. ${event}:${token}`);
          }
        }
      }
    });
  }

  private async expireToken(
    event: string,
    token: string,
  ): Promise<UpdateResult> {
    const user = await this.userRepository.findByToken(event, token);

    if (event === 'signupToken') {
      const command = new DeleteUserCommand(user.id);
      await this.commandBus.execute(command);
      this.logger.verbose(
        `Unverified user data deleted...\n User email: ${JSON.stringify(
          user.email,
        )}`,
      );
    } else {
      this.logger.verbose(
        `${event} expired...\n User email: ${JSON.stringify(user.email)}`,
      );

      return await this.userRepository.updateUser(
        { id: user.id },
        { [event]: null },
      );
    }
  }
}
