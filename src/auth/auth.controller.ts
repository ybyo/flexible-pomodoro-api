import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  LoggerService,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import accessTokenConfig from '@/config/accessTokenConfig';
import refreshTokenConfig from '@/config/refreshTokenConfig';
import { AuthService } from '@/auth/auth.service';
import { ConfigType } from '@nestjs/config';
import { IUser } from '@/type-defs/message.interface';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { LocalGuard } from '@/auth/guard/local.guard';
import { LoggedInGuard } from '@/auth/guard/logged-in.guard';
import { RegisterUserDto } from '@/users/interface/dto/register-user.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(accessTokenConfig.KEY)
    private accessConf: ConfigType<typeof accessTokenConfig>,
    @Inject(accessTokenConfig.KEY)
    private refreshConf: ConfigType<typeof refreshTokenConfig>,
    @Inject(Logger) private readonly logger: LoggerService,
    private authService: AuthService,
  ) {}

  @Post('register')
  registerUser(@Body() user: RegisterUserDto) {
    return this.authService.registerUser(user);
  }

  @UseGuards(LocalGuard)
  @Post('login')
  async login(@Req() req, @Res({ passthrough: true }) res) {
    const user = req.session.passport.user;

    // Refresh tokens are at App.module.ts
    const accessToken = await this.authService.issueToken(user);

    res.cookie('accessToken', accessToken, this.accessConf);

    return req.session;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserInfoWithAccessToken(@Req() req: Request) {
    return req.user;
  }

  // TODO: Refresh시 인증정보 있는지 우선 확인(인증정보 자체가 없다면 재인증요구)
  @UseGuards(LoggedInGuard)
  @Get('refresh')
  async refreshAuth(@Req() req: Request, @Res({ passthrough: true }) res) {
    const user = req.user;

    const accessToken = await this.authService.issueToken(user as IUser);

    res.cookie('accessToken', accessToken, this.accessConf);
    return req.session;
  }

  // TODO: 악의적인 유저로부터 강제로 로그아웃 되지 않도록 고려
  @Delete('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    req.logout(function (err) {
      if (err) {
        return err;
      }
    });

    res.cookie('accessToken', null, { ...this.accessConf, maxAge: 1 });
    return req.session;
  }
}
