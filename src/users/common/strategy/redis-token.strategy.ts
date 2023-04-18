import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
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
    const token = 'query' in req ? req.query['signupVerifyToken'] : null;
    const id = await this.redisService.getValue(`verifyEmail:${token}`);

    if (id === null) {
      throw new BadRequestException('Already verified email');
    }

    await this.redisService.deleteValue(`verifyEmail:${token}`).then(() => {
      this.userRepository.updateUser({ id }, { signupVerifyToken: null });
    });

    return true;
  }
}
