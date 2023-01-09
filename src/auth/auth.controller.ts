import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  LoggerService,
  Param,
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
import { IUser } from '@/type-defs/message.interface';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import cookieConfig from '@/config/accessTokenConfig';
import { ConfigType } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(cookieConfig.KEY) private cookie: ConfigType<typeof cookieConfig>,
    @Inject(Logger) private readonly logger: LoggerService,
    private authService: AuthService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
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

    const loginResult = {
      status: 'success',
      data: user,
    };

    res.cookie('accessToken', accessToken, this.cookie).status(200);

    return loginResult;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserInfoWithAccessToken(@Req() req: Request) {
    return req.user;
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logoutUser(res);
  }

  @Get('refresh')
  async refreshAuth(
    @Req() req: Request,
    @Res({ passthrough: false }) response: Response,
  ) {
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
