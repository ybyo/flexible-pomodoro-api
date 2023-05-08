import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { ulid } from 'ulid';

import { AuthService } from '@/auth/auth.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import accessTokenConfig from '@/config/accessTokenConfig';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { Session } from '@/customTypes/types';
import { IEmailService } from '@/users/application/adapter/iemail.service';
import { IRedisTokenService } from '@/users/application/adapter/iredis-token.service';
import { ChangeEmailCmd } from '@/users/application/command/impl/change-email.cmd';
import { CreateTimestampCmd } from '@/users/application/command/impl/create-timestamp.cmd';
import { DeleteAccountCmd } from '@/users/application/command/impl/delete-account.cmd';
import { VerifyChangeEmailCmd } from '@/users/application/command/impl/verify-change-email.cmd';
import { RedisTokenGuard } from '@/users/common/guard/redis-token.guard';
import { ChangeUsernameDto } from '@/users/interface/dto/change-username.dto';
import { DeleteAccountDto } from '@/users/interface/dto/delete-account.dto';
import { PasswordResetDto } from '@/users/interface/dto/password-reset.dto';

@Controller('users')
export class UserController {
  constructor(
    @Inject('EmailService') private emailService: IEmailService,
    @Inject('RedisTokenService') private redisService: IRedisTokenService,
    @Inject(accessTokenConfig.KEY)
    private accessConf: ConfigType<typeof accessTokenConfig>,
    private authService: AuthService,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(RedisTokenGuard)
  @Get('verify-email')
  async verifyEmail(@Req() req: Request): Promise<IRes> {
    const { event, token } = await this.authService.splitEventToken(req);

    await this.authService.validateToken(event, token);

    return { success: true };
  }

  @Post('send-reset-password-email')
  async sendResetPasswordEmail(@Body() data): Promise<IRes> {
    const { email } = data;
    const ttl = 1 * 60 * 60;

    await this.authService.addTokenAndSendMail(
      email,
      'resetPasswordToken',
      ttl,
    );

    return { success: true };
  }

  @UseGuards(RedisTokenGuard)
  @Get('verify-reset-password-token')
  async verifyResetPasswordToken(
    @Query() query,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes> {
    const { event, token } = await this.authService.splitEventToken(req);

    const newToken = await this.authService.validateAndIssueJWT(event, token);

    if (newToken !== null) {
      res.cookie('resetPasswordToken', newToken, this.accessConf);

      return {
        success: true,
        message: 'Reset password token verified successfully',
      };
    }
  }

  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() body: PasswordResetDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes> {
    const { resetPasswordToken: token } = req.cookies;
    const newPassword = body.password;

    const result = await this.authService.changePassword(token, newPassword);

    if (result.success) {
      res.cookie('resetPasswordToken', null, {
        ...this.accessConf,
        maxAge: 1,
      });

      return result;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-change-mail')
  async sendChangeMail(@Req() req: Request, @Body() body: any): Promise<IRes> {
    const { email: oldEmail, id } = req.user as IUser;
    const newEmail = body.email;
    const changeEmailToken = ulid();

    const cmd = new ChangeEmailCmd(oldEmail, newEmail, changeEmailToken);
    const result = await this.commandBus.execute(cmd);

    if (result.success) {
      await this.emailService.sendTokenMail(
        'changeEmail',
        newEmail,
        changeEmailToken,
      );

      const cmd = new CreateTimestampCmd(id, `changeEmailTokenCreated`);
      await this.commandBus.execute(cmd);

      return {
        success: true,
        message: 'Change email verification email sent successfully',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-change-email')
  async verifyChangeEmail(
    @Req() req: Request,
    @Query() query: any,
    @Res({ passthrough: true }) res,
  ): Promise<IRes | Error> {
    const { changeEmailToken } = query;

    const cmd = new VerifyChangeEmailCmd(changeEmailToken);
    const result = await this.commandBus.execute(cmd);

    if (result.success) {
      const newUser: IUser = result.data;
      const accessToken = await this.authService.issueJWT(newUser);

      res.cookie('accessToken', accessToken, this.accessConf);

      return result;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-name')
  async changeName(
    @Req() req: Request,
    @Body() body: ChangeUsernameDto,
    @Res({ passthrough: true }) res,
  ): Promise<IRes> {
    const { email } = req.user as IUser;
    const { newName } = body;

    const { data: newAccessToken } = await this.authService.changeNameAndJWT(
      email,
      newName,
    );

    res.cookie('accessToken', newAccessToken, this.accessConf);

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  async deleteAccount(
    @Req() req: Request,
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) res,
  ): Promise<Session | IRes> {
    const { id } = req.user as IUser;

    const cmd = new DeleteAccountCmd(id);
    await this.commandBus.execute(cmd);

    req.logout((err) => {
      if (err) return err;
    });

    res.clearCookie('accessToken', { ...this.accessConf, maxAge: 1 });

    req.session.cookie.maxAge = 0;

    return req.session;
  }
}
