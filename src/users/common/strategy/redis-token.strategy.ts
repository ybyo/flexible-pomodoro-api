import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { RedisService } from '@/redis/redis.service';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
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

    let key = '';
    let token = '';

    if (raw === req.cookies.resetPasswordToken) {
      key = 'resetPasswordToken';
      token = raw;
    } else {
      key = Object.keys(raw)[0] as string;
      token = Object.values(raw)[0] as string;
    }

    const id = await this.redisService.getValue(`${key}:${token}`);

    if (id === null) {
      throw new BadRequestException(`${key} is already used or invalid token`);
    }

    await this.redisService.deleteValue(`${key}:${token}`).then(() => {
      this.userRepository.updateUser({ id }, { [key]: null });
    });

    return true;
  }
}
