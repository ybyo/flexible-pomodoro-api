import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { RedisService } from '@/redis/redis.service';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { User } from '@/users/domain/user.model';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserRepository } from '@/users/infra/db/repository/user.repository';

@Injectable()
export class RedisTokenStrategy extends PassportStrategy(
  Strategy,
  'redis-token',
) {
  constructor(
    private readonly redisService: RedisService,
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
  ) {
    super();
  }

  async validate(req: Request): Promise<boolean> {
    const raw =
      'resetPasswordToken' in req.cookies
        ? req.cookies.resetPasswordToken
        : req.query;

    if (raw === null) {
      throw new BadRequestException(`Invalid request`);
    }

    let key;
    let token;

    if (raw === req.cookies.resetPasswordToken) {
      key = 'resetPasswordToken';
      token = raw;
    } else {
      key = Object.keys(raw)[0];
      token = Object.values(raw)[0];
    }

    const redis = await this.redisService.getClient();
    const multi = redis.multi();
    multi.del(`${key}:${token}`);

    await this.userRepository
      .findBySignupVerifyToken(token)
      .then(async (user: Pick<User, 'id'> | null): Promise<void> => {
        if (user !== null) {
          await this.userRepository
            .getDataSource()
            .transaction(async (manager) => {
              await manager.update(
                UserEntity,
                { id: user.id },
                { signupVerifyToken: null },
              );

              await multi.exec();
            });
        }
      })
      .catch(async (err) => {
        await multi.discard();
        throw new InternalServerErrorException('Cannot verify token');
      });

    return true;
  }
}
