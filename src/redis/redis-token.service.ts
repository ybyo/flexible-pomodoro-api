import {
  BadRequestException,
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
export class RedisTokenService {
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

  async setValue(key: string, value: string, duration?: number): Promise<void> {
    if (duration !== undefined) {
      await this.redisClient.set(key, value, 'EX', duration);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  // async setValue(key: string, value: string, duration?: number): Promise<void> {
  //   const args =
  //     duration !== undefined ? [key, value, 'EX', duration] : [key, value];
  //   await this.redisClient.set.apply(this.redisClient, args);
  // }

  async getValue(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async deleteValue(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async getClient(): Promise<Redis> {
    return this.redisClient;
  }

  async getEventToken(req) {
    const raw = req.query;
    if (raw === null) throw new BadRequestException(`Invalid request`);

    const event = Object.keys(raw)[0] as string;
    const token = Object.values(raw)[0] as string;

    return { event, token };
  }

  private async expireToken(
    userRepository: IUserRepository,
    commandBus: CommandBus,
    token: string,
    event: string,
  ): Promise<void> {
    const user =
      event === 'signupToken'
        ? await userRepository.findBySignupToken(token)
        : await userRepository.findByResetPasswordToken(token);

    if (user !== null) {
      if (event === 'signupToken') {
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
}
