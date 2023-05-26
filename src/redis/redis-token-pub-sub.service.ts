import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import Redis from 'ioredis';
import { DeleteResult, UpdateResult } from 'typeorm';

import { REDIS_SUB } from '@/redis/redis.constants';
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

    const client = new Redis({
      port: +process.env.REDIS_PORT,
      host: process.env.REDIS_URL,
    });

    this.setRedisTokenNotify(client, 'Ex');
    this.subRedisToken(client, '__keyevent@0__:expired', tokenList);
  }

  private setRedisTokenNotify(client: Redis, option: string): void {
    if (process.env.NODE_ENV === 'development') {
      client.config('SET', 'notify-keyspace-events', option);
    }
  }

  private subRedisToken(
    client: Redis,
    message: string,
    eventList: string[],
  ): void {
    client.subscribe(message);
    client.on('message', async (channel, key): Promise<void> => {
      if (channel === message) {
        const event = key.split(':')[0];
        const token = key.split(':')[1];

        if (eventList.includes(event)) {
          const result = await this.expireToken(event, token);

          if (!result.affected) {
            this.logger.error(`Cannot expire token. ${event}:${token}`);
          } else {
            this.logger.verbose(`Token expired. ${event}:${token}`);
          }
        }
      }
    });
  }

  private async expireToken(
    event: string,
    token: string,
  ): Promise<UpdateResult | DeleteResult> {
    const user = await this.userRepository.findByToken(event, token);

    if (event === 'signupToken') {
      return await this.userRepository.deleteUser(user.email);
    } else {
      return await this.userRepository.updateUser(
        { id: user.id },
        { [event]: null },
      );
    }
  }
}
