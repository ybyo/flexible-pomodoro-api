import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(ctx)) as boolean;

    return result;
  }

  handleRequest(err, user, info, context, status) {
    // console.log(err, user, info, context, status);
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    // TODO: 자동 갱신 로직 구현
    // } else if (info == 'TokenExpiredError: jwt expired') {
    //   return info;
    // }
    return user;
  }
}
