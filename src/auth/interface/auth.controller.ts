import {
  All,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBody,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService } from '@/auth/application/auth.service';
import { ResendEmailCommand } from '@/auth/application/command/impl/resend-email.command';
import { CheckDuplicateEmailQuery } from '@/auth/application/query/impl/check-duplicate-email.query';
import { GetUserByEmailQuery } from '@/auth/application/query/impl/get-user-by-email.query';
import { RequestWithUserDto } from '@/auth/interface/dto/request-with-user.dto';
import { ResendEmailDto } from '@/auth/interface/dto/resend-email.dto';
import { SuccessDto } from '@/auth/interface/dto/success.dto';
import { UserJwtWithVerifiedDto } from '@/auth/interface/dto/user-jwt-with-verified.dto';
import { JwtAuthGuard } from '@/auth/interface/guard/jwt-auth.guard';
import { LocalGuard } from '@/auth/interface/guard/local.guard';
import { LoggedInGuard } from '@/auth/interface/guard/logged-in.guard';
import accessTokenConfig from '@/config/accessTokenConfig';
import refreshTokenConfig from '@/config/refreshTokenConfig';
import { Session } from '@/shared/types/common-types';
import { IEmailAdapter } from '@/users/application/adapter/iemail.adapter';
import { CheckDuplicateEmailDto } from '@/users/interface/dto/check-duplicate-email.dto';
import { LoginUserDto } from '@/users/interface/dto/login-user.dto';
import { RegisterUserDto } from '@/users/interface/dto/register-user.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    @Inject(accessTokenConfig.KEY)
    private accessConf: ConfigType<typeof accessTokenConfig>,
    @Inject(refreshTokenConfig.KEY)
    private refreshConf: ConfigType<typeof refreshTokenConfig>,
    @Inject('EmailService') private emailService: IEmailAdapter,
    private authService: AuthService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Patch('check-duplicate-email')
  @ApiOperation({ summary: 'Check duplicate email' })
  @ApiBody({ type: CheckDuplicateEmailDto })
  @ApiResponse({ type: CheckDuplicateEmailDto })
  async CheckDuplicateEmail(
    @Body() dto: CheckDuplicateEmailDto,
  ): Promise<CheckDuplicateEmailDto> {
    const query = new CheckDuplicateEmailQuery(dto.email);
    return await this.commandBus.execute(query);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    description: 'Register user successfully',
  })
  async registerUser(
    @Req() req: Request,
    @Body() body: RegisterUserDto,
  ): Promise<SuccessDto> {
    return await this.authService.registerUser(body);
  }

  @UseGuards(LocalGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    description: 'Logged in successfully and return access token',
  })
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Session> {
    const user = req.user;
    const token = await this.authService.issueJWT(user);

    res.cookie('accessToken', token, this.accessConf);

    return req.session;
  }

  @UseGuards(LoggedInGuard)
  @Get('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiQuery({ type: RequestWithUserDto })
  @ApiResponse({
    description: 'Access token renewed successfully',
  })
  async refreshAuth(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Session> {
    const token = await this.authService.issueJWT(req.user);

    res.cookie('accessToken', token, this.accessConf);

    return req.session;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Return user essential information' })
  @ApiCookieAuth('accessToken')
  @ApiQuery({ type: RequestWithUserDto })
  @ApiResponse({
    type: UserJwtWithVerifiedDto,
  })
  async getMe(@Req() req: Request): Promise<UserJwtWithVerifiedDto> {
    const query = new GetUserByEmailQuery(req.user.email);
    const result = await this.queryBus.execute(query);

    return {
      id: result.data.id,
      email: result.data.email,
      name: result.data.name,
      isVerified: !result.data.signupToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  @ApiOperation({ summary: 'Logout user and remove server side session data' })
  @ApiCookieAuth('accessToken')
  @ApiQuery({ type: RequestWithUserDto })
  @ApiResponse({
    description:
      'Remove server-side session data and nullify access token on client',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Session> {
    req.logout((err) => {
      if (err) return err;
    });

    res.clearCookie('accessToken', { ...this.accessConf, maxAge: 1 });
    req.session.cookie.maxAge = 1;

    return req.session;
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-signup-email')
  @ApiOperation({
    summary: 'Resend signup email',
  })
  @ApiBody({ type: ResendEmailDto })
  @ApiResponse({
    description:
      'Renewed verification link and resent signup verification email successfully',
  })
  async resendSignupEmail(@Body() dto: ResendEmailDto): Promise<SuccessDto> {
    const command = new ResendEmailCommand(dto.email);
    return await this.commandBus.execute(command);
  }

  @ApiExcludeEndpoint()
  @All('*')
  handleNotFound(): Promise<NotFoundException> {
    throw new NotFoundException('The requested resource could not be found.');
  }
}
