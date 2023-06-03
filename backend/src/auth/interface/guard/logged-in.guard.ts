import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class LoggedInGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    return ctx.switchToHttp().getRequest().isAuthenticated();
  }
}
