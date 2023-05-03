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
import { ChangeNameCommand } from '@/users/application/command/impl/change-name.command';
import { CheckTokenValidityQuery } from '@/users/application/command/impl/check-token-validity.query';
import { CreateTimestampCommand } from '@/users/application/command/impl/create-timestamp.command';
import { DeleteAccountCommand } from '@/users/application/command/impl/delete-account.command';
import { UpdatePasswordCmd } from '@/users/application/command/impl/update-password.cmd';
import { VerifyChangeEmailCommand } from '@/users/application/command/impl/verify-change-email.command';
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
    private redisService: RedisTokenService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @UseGuards(RedisTokenGuard)
  @Get('verify-email')
  async verifyEmail(@Query() query, @Req() req): Promise<IRes> {
    const { event, token } = await this.redisService.getEventToken(req);
    const qry = new CheckTokenValidityQuery('signupToken', token);
    const user = await this.queryBus.execute(qry);

    if (user !== null) {
      await this.authService.updateToken(event, token, user.id);
    } else {
      await this.redisService.deleteValue(`${event}:${token}`);
      throw new BadRequestException(`Invalid token`);
    }

    return { success: true };
  }

  @Post('send-reset-password-email')
  async sendResetPasswordEmail(@Body() data): Promise<IRes<any>> {
    const { email } = data;
    const command = new CheckEmailDupCmd(email);
    const result = await this.commandBus.execute(command);

    if (result.success === false) {
      const resetPasswordToken = await this.authService.issueUlid();
      const command = new AddTokenToDBCmd(
        email,
        'resetPasswordToken',
        resetPasswordToken,
      );
      await this.commandBus.execute(command);
      await this.emailService.sendResetPasswordToken(email, resetPasswordToken);

      return {
        success: true,
        message: 'Reset password verification email sent successfully.',
      };
    }

    return {
      success: false,
      message: 'Email does not exist.',
    };
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

    const payload: IUser = {
      id: user.id,
      userName: user.userName,
      email: user.email,
    };
    const cookieToken = await this.authService.issueJWT(payload);

    if (user !== null) {
      res.cookie('resetPasswordToken', cookieToken, this.accessConf);
    } else {
      await this.redisService.deleteValue(`${event}:${token}`);
      throw new BadRequestException(`Invalid reset password verification code`);
    }

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

  @Post('reset-password')
  async resetPassword(
    @Req() req: Request,
    @Body() body: PasswordResetDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRes> {
    const newPassword = body.password;

    if ('resetPasswordToken' in req.cookies) {
      const resetPasswordToken = req.cookies.resetPasswordToken;
      const user = await this.authService.verifyJWT(resetPasswordToken);
      const { event, token } = await this.redisService.getEventToken(req);

      const cmd = new UpdatePasswordCmd(user.data.email, newPassword);
      const result = await this.commandBus.execute(cmd);

      if (result.success === true) {
        await this.authService.updateToken(event, token, user.data.id);
        res.cookie('resetPasswordToken', null, {
          ...this.accessConf,
          maxAge: 1,
        });
      }

      return result;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(
    @Req() req: Request,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    let oldEmail;
    let uid;
    if ('email' in req.user && 'id' in req.user) {
      oldEmail = req.user.email;
      uid = req.user.id;
    }
    const newEmail = body.email;
    const changeEmailVerifyToken = ulid();
    const command = new ChangeEmailCommand(
      oldEmail,
      newEmail,
      changeEmailVerifyToken,
    );
    const response = await this.commandBus.execute(command);

    if (response.success === true) {
      try {
        await this.emailService.sendChangeEmailVerification(
          newEmail,
          changeEmailVerifyToken,
        );

        const command = new CreateTimestampCommand(
          uid,
          `changeEmailTokenCreated`,
        );
        const response = await this.commandBus.execute(command);
      } catch (err) {
        console.log(err);
      }
    }

    return {
      success: true,
      message: 'Change email verification email sent successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-change-email')
  async verifyChangeEmail(
    @Req() req: Request,
    @Query() query: any,
    @Res({ passthrough: true }) res,
  ) {
    let changeEmailVerifyToken;
    if ('changeEmailVerifyToken' in query) {
      changeEmailVerifyToken = query.changeEmailVerifyToken;
    }
    let response = {} as IRes<IUser>;
    response.success = false;
    const command = new VerifyChangeEmailCommand(changeEmailVerifyToken);
    response = await this.commandBus.execute(command);

    if (response.success === true) {
      const newUser: IUser = response.data;
      const accessToken = await this.authService.issueJWT(newUser);
      res.cookie('accessToken', accessToken, this.accessConf);

      return response;
    } else {
      throw new BadRequestException(
        'Something went wrong. Change email reverted',
      );
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

    const command = new ChangeNameCommand(email, newName);
    const response = await this.commandBus.execute(command);
    if (response.success === true) {
      const newUser: IUser = response.data;
      const accessToken = await this.authService.issueJWT(newUser);
      res.cookie('accessToken', accessToken, this.accessConf);

      return response;
    }

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  async deleteAccount(
    @Req() req: Request,
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) res,
  ): Promise<Session | IRes> {
    let id: string | null;

    if ('id' in req.user) {
      id = req.user.id as string;
    }

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

    return {
      success: false,
      message: 'Cannot delete account. Please try again.',
    };
  }
}
