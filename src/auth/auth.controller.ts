import { AuthService } from '@/auth/auth.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { LocalGuard } from '@/auth/guard/local.guard';
import { LoggedInGuard } from '@/auth/guard/logged-in.guard';
import accessTokenConfig from '@/config/accessTokenConfig';
import refreshTokenConfig from '@/config/refreshTokenConfig';
import { IRes, IUser } from '@/type-defs/message.interface';
import { CheckEmailDto } from '@/users/interface/dto/check-email.dto';
import { RegisterUserDto } from '@/users/interface/dto/register-user.dto';
import {
  BadRequestException,
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
import { CheckEmailDto } from '@/users/interface/dto/check-email.dto';
import { ConfigType } from '@nestjs/config';
import { IRes, IUser } from '@/type-defs/message.interface';
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
    @Inject(refreshTokenConfig.KEY)
    private refreshConf: ConfigType<typeof refreshTokenConfig>,
    @Inject(Logger) private readonly logger: LoggerService,
    private authService: AuthService,
  ) {}

  @Post('register')
  registerUser(@Req() req: any, @Body() user: RegisterUserDto) {
    return this.authService.registerUser(user);
  }

  @UseGuards(LocalGuard)
  @Post('login')
  async login(@Req() req, @Res({ passthrough: true }) res) {
    const user = req.session.passport.user;

    const accessToken: string = await this.authService.issueToken(user);

    res.cookie('accessToken', accessToken, this.accessConf);

    return req.session;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserInfoWithAccessToken(@Req() req: Request) {
    return req.user;
  }

  // TODO: Refresh 시 인증정보 있는지 우선 확인(인증정보 자체가 없다면 재인증요구)
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

  @Post('check-email')
  async checkEmail(
    @Body() dto: CheckEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response: IRes<any> = await this.authService.checkEmail(dto);

    if (response.success === false) {
      throw new BadRequestException('Duplicate email');
    }

    // TODO: 아무런 응답도 전송하지 않으면 왜 201로 응답하는지 확인
    // res.cookie('uniqueEmailToken', uniqueEmailToken, { ...this.accessConf });
    return response;
  }
}
