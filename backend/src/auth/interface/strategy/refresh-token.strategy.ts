import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { RedisTokenService } from '@/redis/redis-token.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token'
) {
  constructor(private redisService: RedisTokenService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    console.log(req);
    if (req.cookies.hasOwnProperty('refreshToken') === false) {
      throw new UnauthorizedException('No refreshToken');
    }

    const refreshToken = req.cookies['refreshToken']
      .split(':')[1]
      .split('.')[0];
    const sessionString = await this.redisService.getValue(
      `sess:${refreshToken}`
    );
    const sessionObject = JSON.parse(sessionString);

    return sessionObject.hasOwnProperty('passport')
      ? sessionObject.passport.user
      : false;
  }
}
