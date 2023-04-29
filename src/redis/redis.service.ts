import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import Redis from 'ioredis';

import { REDIS } from '@/redis/redis.constants';
import { DeleteAccountCommand } from '@/users/application/command/impl/delete-account.command';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
export class RedisService {
  constructor(
    private commandBus: CommandBus,
    @Inject(REDIS) private readonly redisClient: Redis,
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {
    // Remove unverified user account
    const listenClient = new Redis({
      port: +process.env.REDIS_PORT,
      host: process.env.REDIS_URL,
    });

    if (process.env.NODE_ENV === 'development') {
      listenClient.config('SET', 'notify-keyspace-events', 'Ex');
    }

    listenClient.subscribe('__keyevent@0__:expired');
    listenClient.on('message', async (channel, key): Promise<void> => {
      if (channel === '__keyevent@0__:expired') {
        const event = key.split(':')[0];
        const token = key.split(':')[1];

        if (event === 'signupVerifyToken' || event === 'resetPasswordToken') {
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

  async setValue(key: string, value: string, duration?: number): Promise<void> {
    if (duration !== undefined) {
      await this.redisClient.set(key, value, 'EX', duration);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async getValue(key: string): Promise<any> {
    return this.redisClient.get(key);
  }

  async deleteValue(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async getClient(): Promise<Redis> {
    return this.redisClient;
  }

  private async expireToken(
    userRepository: IUserRepository,
    commandBus: CommandBus,
    token: string,
    event: string,
  ): Promise<void> {
    const user =
      event === 'signupVerifyToken'
        ? await userRepository.findBySignupVerifyToken(token)
        : await userRepository.findByResetPasswordVerifyToken(token);

    if (user === null) {
      throw new InternalServerErrorException(
        `Cannot find user with ${event}. \nToken: ${token}`,
      );
    }

    if (event === 'signupVerifyToken') {
      const command = new DeleteAccountCommand(user.id);
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
