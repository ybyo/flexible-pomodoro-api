import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  LoggerService,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';

import { AuthService } from '@/auth/auth.service';
import { RegisterUserCmd } from '@/auth/command/impl/register-user.cmd';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { LocalGuard } from '@/auth/guard/local.guard';
import { LoggedInGuard } from '@/auth/guard/logged-in.guard';
import { CheckDuplicateUsernameQuery } from '@/auth/query/impl/check-duplicate-username.query';
import { GetUserByUserIdQuery } from '@/auth/query/impl/get-user-by-userid.query';
import accessTokenConfig from '@/config/accessTokenConfig';
import refreshTokenConfig from '@/config/refreshTokenConfig';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { Session } from '@/customTypes/types';
import { AddTokenToDBCmd } from '@/users/application/command/impl/add-token-to-db.cmd';
import { UserRegisterEvent } from '@/users/domain/user-register.event';
import { CheckEmailDto } from '@/users/interface/dto/check-email.dto';
import { RegisterUserDto } from '@/users/interface/dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(accessTokenConfig.KEY)
    private accessConf: ConfigType<typeof accessTokenConfig>,
    @Inject(refreshTokenConfig.KEY)
    private refreshConf: ConfigType<typeof refreshTokenConfig>,

    @Inject(Logger) private readonly logger: LoggerService,
    private authService: AuthService,
    private commandBus: CommandBus,
    private eventBus: EventBus,
    private queryBus: QueryBus,
  ) {}

  @Post('register')
  async registerUser(
    @Req() req: Request,
    @Body() user: RegisterUserDto,
  ): Promise<IUser> {
    const isDuplicated = (await this.checkDuplicateUserName(user)).success;

    if (isDuplicated) {
      const { userName, email, password } = user;
      const command = new RegisterUserCmd(userName, email, password);

      return await this.commandBus.execute(command);
    }
  }

  async checkDuplicateUserName(@Body() user: RegisterUserDto): Promise<IRes> {
    let result = {} as IUser;
    const query = new CheckDuplicateUsernameQuery(user.userName);

    try {
      result = await this.queryBus.execute(query);
    } catch (err) {
      throw new HttpException(
        'Unable to perform the query.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (result !== null) {
      throw new BadRequestException('Duplicate username');
    }

    return { success: true };
  }

  @UseGuards(LocalGuard)
  @Post('login')
  async login(@Req() req, @Res({ passthrough: true }) res): Promise<Session> {
    const user = req.session.passport.user;

    try {
      const accessToken = await this.authService.issueJWT(user);
      res.cookie('accessToken', accessToken, this.accessConf);
    } catch (err) {
      this.logger.log(err);
    }

    return req.session;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserInfoWithAccessToken(@Req() req: Request) {
    if ('id' in req.user) {
      const query = new GetUserByUserIdQuery(req.user.id as string);
      const result = await this.queryBus.execute(query);

      return {
        id: result.id,
        userName: result.userName,
        email: result.email,
        isVerified: !result.signupToken,
      };
    }
  }

  // TODO: Refresh 시 인증정보 있는지 우선 확인(인증정보 자체가 없다면 재인증요구)
  @UseGuards(LoggedInGuard)
  @Get('refresh')
  async refreshAuth(@Req() req: Request, @Res({ passthrough: true }) res) {
    const user = req.user;
    const accessToken = await this.authService.issueJWT(user as IUser);

    res.cookie('accessToken', accessToken, this.accessConf);
    return req.session;
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
  async checkEmail(
    @Body() dto: CheckEmailDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes> {
    try {
      return await this.authService.checkEmail(dto);
    } catch (error) {
      throw new BadRequestException('Duplicate email');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-signup-email')
  async resendSignupEmail(
    @Body() body: { email: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes> {
    const token = await this.authService.issueUlid();
    const { email } = body;

    const cmd = new AddTokenToDBCmd(email, 'signupToken', token);
    const result = await this.commandBus.execute(cmd);

    if (result.success === true) {
      await this.eventBus.publish(new UserRegisterEvent(email, token));
      return {
        success: true,
        message: 'Signup verification email sent successfully',
      };
    }

    throw new BadRequestException('Cannot resend signup email');
  }
}
