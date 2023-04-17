import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RedisTokenGuard extends AuthGuard('redis-token') {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    return (await super.canActivate(ctx)) as boolean;
  }

  handleRequest(err, user, info, context, status) {
    // console.log(err, user, info, context, status);
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    // } else if (info == 'TokenExpiredError: jwt expired') {
    //   return info;
    // }
    return user;
  }
}
