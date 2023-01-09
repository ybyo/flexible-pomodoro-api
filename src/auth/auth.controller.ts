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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { RegisterUserDto } from '@/users/interface/dto/register-user.dto';
import { LocalGuard } from '@/auth/guard/local.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import accessTokenConfig from '@/config/accessTokenConfig';
import refreshTokenConfig from '@/config/accessTokenConfig';
import { ConfigType } from '@nestjs/config';
import { LoggedInGuard } from '@/auth/guard/logged-in.guard';

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

  // @UseGuards(JwtAuthGuard)
  @UseGuards(LoggedInGuard)
  @Get('me')
  async getUserInfoWithAccessToken(@Req() req: Request) {
    return req.session;
  }

  // TODO: Passport 라이브러리 활용하여 리프레시토큰 로직 추가, 기존 인증 로직 개선
  @Get('refresh')
  async refreshAuth(@Req() req: Request) {
    const jwtString = req.cookies['accessToken'];

    if (!jwtString) {
      throw new UnauthorizedException('No access token');
    }

    const result = await this.authService.verify(jwtString);

    if (result.success === false) {
      const user = result.data;
      if (result.message === 'jwt expired') {
        console.log('cookie reissued');
        // await this.authService.issueCookie(user, response);
      } else {
        console.log('invalid token');
        throw new UnauthorizedException('invalid token');
      }
    }
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

  // @Get(':userId')
  // async getUserInfoWithUserId(@Param('userId') userId: string): Promise<IUser> {
  //   // const getUserInfoQuery = new GetUserByUserId(userId);
  //   //
  //   // return this.queryBus.execute(getUserInfoQuery);
  //   return this.authService.findByUserId(userId);
  // }
}
