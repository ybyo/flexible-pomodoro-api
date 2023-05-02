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
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { UserRepository } from '@/users/infra/db/repository/user.repository';

@Injectable()
export class RedisTokenStrategy extends PassportStrategy(
  Strategy,
  'redis-token',
) {
  constructor(
    private readonly redisService: RedisTokenService,
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

    let event;
    let token;

    if (raw === req.cookies.resetPasswordToken) {
      event = 'resetPasswordToken';
      token = raw;
    } else {
      event = Object.keys(raw)[0];
      token = Object.values(raw)[0];
    }

    const isValid = await this.redisService.getValue(`${event}:${token}`);
    if (!isValid) return false;

    const redis = await this.redisService.getClient();
    const multi = redis.multi();
    multi.del(`${event}:${token}`);

    const user =
      event === 'signupVerifyToken'
        ? await this.userRepository.findBySignupVerifyToken(token)
        : await this.userRepository.findByResetPasswordVerifyToken(token);

    if (user !== null) {
      try {
        await this.userRepository
          .getDataSource()
          .transaction(async (manager) => {
            await manager.update(
              UserEntity,
              { id: user.id },
              { [event]: null },
            );

            await multi.exec();
          });
      } catch (err) {
        await multi.discard();
        throw new InternalServerErrorException('Cannot verify token');
      }
    } else {
      throw new BadRequestException(`Invalid request`);
    }

    return true;
  }
}
