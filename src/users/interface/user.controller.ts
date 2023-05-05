import {
  BadRequestException,
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
import { CheckEmailDupCmd } from '@/auth/command/impl/check-email-dup.cmd';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import accessTokenConfig from '@/config/accessTokenConfig';
import { IRes, IUser } from '@/customTypes/interfaces/message.interface';
import { Session } from '@/customTypes/types';
import { RedisTokenService } from '@/redis/redis-token.service';
import { IEmailService } from '@/users/application/adapter/iemail.service';
import { AddTokenToDBCmd } from '@/users/application/command/impl/add-token-to-db.cmd';
import { ChangeEmailCommand } from '@/users/application/command/impl/change-email.command';
import { ChangeNameCmd } from '@/users/application/command/impl/change-name.cmd';
import { CheckTokenValidityQuery } from '@/users/application/command/impl/check-token-validity.query';
import { CreateTimestampCmd } from '@/users/application/command/impl/create-timestamp.cmd';
import { DeleteAccountCommand } from '@/users/application/command/impl/delete-account.command';
import { UpdatePasswordCmd } from '@/users/application/command/impl/update-password.cmd';
import { VerifyChangeEmailCmd } from '@/users/application/command/impl/verify-change-email.cmd';
import { PasswordResetGuard } from '@/users/common/guard/password-reset.guard';
import { RedisTokenGuard } from '@/users/common/guard/redis-token.guard';
import { ChangeUsernameDto } from '@/users/interface/dto/change-username.dto';
import { DeleteAccountDto } from '@/users/interface/dto/delete-account.dto';
import { PasswordResetDto } from '@/users/interface/dto/password-reset.dto';

@Controller('users')
export class UserController {
  constructor(
    @Inject('EmailService') private emailService: IEmailService,
    @Inject(accessTokenConfig.KEY)
    private accessConf: ConfigType<typeof accessTokenConfig>,
    private authService: AuthService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private redisService: RedisTokenService,
  ) {}

  @UseGuards(RedisTokenGuard)
  @Get('verify-email')
  async verifyEmail(@Query() query, @Req() req): Promise<IRes> {
    const { event, token } = await this.redisService.getEventToken(req);

    const qry = new CheckTokenValidityQuery('signupToken', token);
    const user = await this.queryBus.execute(qry);

    if (!!user) {
      await this.authService.updateToken(event, token, user.id);

      return { success: true };
    }

    // Delete invalid token in Redis
    await this.redisService.deleteValue(`${event}:${token}`);

    throw new BadRequestException(`Invalid token`);
  }

  @Post('send-reset-password-email')
  async sendResetPasswordEmail(@Body() data): Promise<IRes<any>> {
    const { email } = data;
    const command = new CheckEmailDupCmd(email);
    const result = await this.commandBus.execute(command);

    if (!result.success) {
      const resetPasswordToken = await this.authService.issueUlid();
      const command = new AddTokenToDBCmd(
        email,
        'resetPasswordToken',
        resetPasswordToken,
      );
      await this.commandBus.execute(command);

      await this.emailService.sendTokenEmail(
        'resetPassword',
        email,
        resetPasswordToken,
      );

      return { success: true };
    }

    return { success: false };
  }

  @UseGuards(RedisTokenGuard)
  @Get('verify-reset-password-token')
  async verifyResetPasswordToken(
    @Query() query,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes<IUser>> {
    const { event, token } = await this.redisService.getEventToken(req);
    const qry = new CheckTokenValidityQuery('resetPasswordToken', token);
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

    throw new BadRequestException(`Invalid reset password verification token`);
  }

  @UseGuards(PasswordResetGuard)
  @Post('reset-password')
  async resetPassword(
    @Req() req: Request,
    @Body() body: PasswordResetDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes> {
    const { resetPasswordToken: token } = req.cookies;

    if (token !== undefined) {
      const resetPasswordToken = req.cookies.resetPasswordToken;
      const user = await this.authService.verifyJWT(resetPasswordToken);

      const newPassword = body.password;
      const cmd = new UpdatePasswordCmd(user.data.email, newPassword);
      const result = await this.commandBus.execute(cmd);

      if (result.success === true) {
        await this.authService.updateToken(
          'resetPasswordToken',
          token,
          user.data.id,
        );

        res.cookie('resetPasswordToken', null, {
          ...this.accessConf,
          maxAge: 1,
        });
      }

      return result;
    }

    throw new BadRequestException('Missing required parameter');
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(@Req() req: Request, @Body() body: any): Promise<IRes> {
    const { email: oldEmail, id } = req.user as IUser;
    const newEmail = body.email;
    const changeEmailVerifyToken = ulid();

    if (oldEmail !== undefined && id !== undefined) {
      const cmd = new ChangeEmailCommand(
        oldEmail,
        newEmail,
        changeEmailVerifyToken,
      );
      const response = await this.commandBus.execute(cmd);

      if (response.success === true) {
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

    throw new BadRequestException('Missing required parameter');
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-change-email')
  async verifyChangeEmail(
    @Req() req: Request,
    @Query() query: any,
    @Res({ passthrough: true }) res,
  ): Promise<IRes | Error> {
    const { changeEmailToken } = query;

    if (changeEmailToken !== undefined) {
      const cmd = new VerifyChangeEmailCmd(changeEmailToken);
      const result = await this.commandBus.execute(cmd);

      if (result.success === true) {
        const newUser: IUser = result.data;
        const accessToken = await this.authService.issueJWT(newUser);

        res.cookie('accessToken', accessToken, this.accessConf);

        return result;
      }
    }

    throw new BadRequestException('Missing required parameter');
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

    const command = new ChangeNameCmd(email, newName);
    const response = await this.commandBus.execute(command);

    if (response.success === true) {
      const newUser: IUser = response.data;
      const accessToken = await this.authService.issueJWT(newUser);
      res.cookie('accessToken', accessToken, this.accessConf);

      return response;
    }

    throw new BadRequestException('Duplicate username');
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  async deleteAccount(
    @Req() req: Request,
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) res,
  ): Promise<Session | IRes> {
    const { id } = req.user as IUser;

    if (id !== null) {
      const command = new DeleteAccountCommand(id);
      await this.commandBus.execute(command);

      req.logout((err) => {
        if (err) return err;
      });

      res.clearCookie('accessToken', { ...this.accessConf, maxAge: 1 });
      req.session.cookie.maxAge = 0;

      return req.session;
    }

    throw new BadRequestException('Cannot delete account');
  }
}
