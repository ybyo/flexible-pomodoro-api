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
import { CheckDupNameQry } from '@/auth/query/impl/check-dup-name.qry';
import accessTokenConfig from '@/config/accessTokenConfig';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { Session } from '@/customTypes/types';
import { IEmailService } from '@/users/application/adapter/iemail.service';
import { IRedisTokenService } from '@/users/application/adapter/iredis-token.service';
import { AddTokenToDBCmd } from '@/users/application/command/impl/add-token-to-db.cmd';
import { ChangeEmailCmd } from '@/users/application/command/impl/change-email.cmd';
import { ChangeNameCmd } from '@/users/application/command/impl/change-name.cmd';
import { CheckTokenValidityQry } from '@/users/application/command/impl/check-token-validity.qry';
import { CreateTimestampCmd } from '@/users/application/command/impl/create-timestamp.cmd';
import { DeleteAccountCmd } from '@/users/application/command/impl/delete-account.cmd';
import { UpdatePasswordCmd } from '@/users/application/command/impl/update-password.cmd';
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
    private queryBus: QueryBus,
  ) {}

  // Url의 쿼리 부분에서 토큰을 확인
  @UseGuards(RedisTokenGuard)
  @Get('verify-email')
  async verifyEmail(@Query() query, @Req() req): Promise<IRes> {
    // Redis에서 키 값이 존재하는 지 확인
    const { event, token } = await this.redisService.getEventToken(req);
    // DB에서 토큰을 갱신해야함
    await this.authService.updateToken(event, token);

    return { success: true };
  }

  @Post('send-reset-password-email')
  async sendResetPasswordEmail(@Body() data): Promise<IRes<any>> {
    const { email } = data;

    const resetPasswordToken = await this.authService.issueUlid();
    const cmd = new AddTokenToDBCmd(
      email,
      'resetPasswordToken',
      resetPasswordToken,
    );
    await this.commandBus.execute(cmd);

    await this.emailService.sendTokenEmail(
      'resetPassword',
      email,
      resetPasswordToken,
    );

    return { success: true };
  }

  @UseGuards(RedisTokenGuard)
  @Get('verify-reset-password-token')
  async verifyResetPasswordToken(
    @Query() query,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes<IUser>> {
    const { event, token } = await this.redisService.getEventToken(req);
    const qry = new CheckTokenValidityQry('resetPasswordToken', token);
    const user = await this.queryBus.execute(qry);

    if (!!user) {
      const cookieToken = await this.authService.issueJWT({
        id: user.id,
        userName: user.userName,
        email: user.email,
      });
      res.cookie('resetPasswordToken', cookieToken, this.accessConf);

      await this.redisService.deleteValue(`${event}:${token}`);

      return {
        success: true,
        message: 'Reset password token verified successfully',
        data: {
          id: user.id,
          userName: user.userName,
          email: user.email,
        },
      };
    }

    // Delete invalid token in Redis
    await this.redisService.deleteValue(`${event}:${token}`);
  }

  @Post('reset-password')
  async resetPassword(
    @Req() req: Request,
    @Body() body: PasswordResetDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes> {
    const { resetPasswordToken: token } = req.cookies;
    const newPassword = body.password;

    const cmd = new UpdatePasswordCmd(token, newPassword);
    const result = await this.commandBus.execute(cmd);

    if (result.success) {
      res.cookie('resetPasswordToken', null, {
        ...this.accessConf,
        maxAge: 1,
      });

      return result;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(@Req() req: Request, @Body() body: any): Promise<IRes> {
    const { email: oldEmail, id } = req.user as IUser;
    const newEmail = body.email;
    const changeEmailVerifyToken = ulid();

    const cmd = new ChangeEmailCmd(oldEmail, newEmail, changeEmailVerifyToken);
    const result = await this.commandBus.execute(cmd);

    if (result.success) {
      await this.emailService.sendTokenEmail(
        'changeEmail',
        newEmail,
        changeEmailVerifyToken,
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
    const { newName } = body;
    const { email } = req.user as IUser;

    const qry = new CheckDupNameQry(newName);
    await this.queryBus.execute(qry);

    const cmd = new ChangeNameCmd(email, newName);
    const result = await this.commandBus.execute(cmd);

    if (result.success) {
      const newUser = result.data;
      const accessToken = await this.authService.issueJWT(newUser);

      res.cookie('accessToken', accessToken, this.accessConf);

      return result;
    }
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
