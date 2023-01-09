import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class LoggedInGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    console.log(context.switchToHttp().getRequest().isAuthenticated());
    return context.switchToHttp().getRequest().isAuthenticated();
  }
}
