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
import { ConfigType } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';

import { AuthService } from '@/auth/auth.service';
import { CheckEmailDupCmd } from '@/auth/command/impl/check-email-dup.cmd';
import { RegisterUserCmd } from '@/auth/command/impl/register-user.cmd';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { LocalGuard } from '@/auth/guard/local.guard';
import { LoggedInGuard } from '@/auth/guard/logged-in.guard';
import { CheckDupNameQry } from '@/auth/query/impl/check-dup-name.qry';
import { GetUserByIdQry } from '@/auth/query/impl/get-user-by-id.qry';
import accessTokenConfig from '@/config/accessTokenConfig';
import refreshTokenConfig from '@/config/refreshTokenConfig';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { Session } from '@/customTypes/types';
import { IEmailService } from '@/users/application/adapter/iemail.service';
import { AddTokenToDBCmd } from '@/users/application/command/impl/add-token-to-db.cmd';
import { CheckEmailDto } from '@/users/interface/dto/check-email.dto';
import { RegisterUserDto } from '@/users/interface/dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(accessTokenConfig.KEY)
    private accessConf: ConfigType<typeof accessTokenConfig>,
    @Inject(refreshTokenConfig.KEY)
    private refreshConf: ConfigType<typeof refreshTokenConfig>,

    @Inject('EmailService') private emailService: IEmailService,
    @Inject(Logger) private logger: LoggerService,
    private authService: AuthService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post('register')
  async registerUser(
    @Req() req: Request,
    @Body() user: RegisterUserDto,
  ): Promise<IRes> {
    const qry = new CheckDupNameQry(user.userName);
    const result = await this.queryBus.execute(qry);

    if (result.success) {
      const { userName, email, password } = user;
      const cmd = new RegisterUserCmd(userName, email, password);
      const { success, data: token } = await this.commandBus.execute(cmd);

      if (success) {
        const result = await this.emailService.sendTokenEmail(
          'signup',
          email,
          token,
        );

        return result;
      }
    }
  }

  @UseGuards(LocalGuard)
  @Post('login')
  async login(@Req() req, @Res({ passthrough: true }) res): Promise<Session> {
    const user = req.session.passport.user;
    const token = await this.authService.issueJWT(user);

    res.cookie('accessToken', token, this.accessConf);

    return req.session;
  }

  // TODO: Refresh 시 인증정보 있는지 우선 확인(인증정보 자체가 없다면 재인증요구)
  @UseGuards(LoggedInGuard)
  @Get('refresh')
  async refreshAuth(@Req() req: Request, @Res({ passthrough: true }) res) {
    const user = req.user as IUser;
    const token = await this.authService.issueJWT(user);

    res.cookie('accessToken', token, this.accessConf);

    return req.session;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserInfoWithAccessToken(@Req() req: Request) {
    const { id } = req.user as IUser;

    const query = new GetUserByIdQry(id);
    const result = await this.queryBus.execute(query);

    return {
      id: result.id,
      userName: result.userName,
      email: result.email,
      isVerified: !result.signupToken,
    };
  }

  @Delete('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    req.logout((err) => {
      if (err) return err;
    });

    res.clearCookie('accessToken', { ...this.accessConf, maxAge: 1 });
    req.session.cookie.maxAge = 1;

    return req.session;
  }

  @Post('check-email')
  async checkEmail(@Body() dto: CheckEmailDto): Promise<IRes> {
    const { email } = dto;
    const command = new CheckEmailDupCmd(email);
    const result = await this.commandBus.execute(command);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-signup-email')
  async resendSignupEmail(@Body() body: { email: string }): Promise<IRes> {
    const { email } = body;
    const token = await this.authService.issueUlid();

    const cmd = new AddTokenToDBCmd(email, 'signupToken', token);
    const result = await this.commandBus.execute(cmd);

    if (result.success) {
      const result = await this.emailService.sendTokenEmail(
        'signup',
        email,
        token,
      );

      return result;
    }
  }
}
