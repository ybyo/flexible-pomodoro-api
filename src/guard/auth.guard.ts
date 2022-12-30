import { AuthService } from '@/auth/auth.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const result = this.validateRequest(request);

    return result.success;
  }

  private validateRequest(request: Request) {
    const jwtString = request.cookies['accessToken'];

    return this.authService.verify(jwtString);
  }
}
