import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Inject,
  LoggerService,
  Logger,
  Res,
} from '@nestjs/common';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyEmailCommand } from '../application/command/verify-email.command';
import { UserLoginDto } from './dto/user-login.dto';
import { UserInfo } from './UserInfo';
import { Response } from 'express';
import { LoginCommand } from '../application/command/login.command';
import { GetUserInfoQuery } from '../application/query/get-user-info.query';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserCommand } from '../application/command/create-user.command';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    @Inject(Logger) private readonly logger: LoggerService,
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<void> {
    const { name, email, password } = dto;

    const command = new CreateUserCommand(name, email, password);

    return this.commandBus.execute(command);
  }

  // TODO: 계정 인증 시, 로그에 액세스 토큰이 프론트로 전송됐는지 여부와 생성된 계정 정보만 출력하도록 수정
  @Post('/verify-email')
  async verifyEmail(@Query() dto: VerifyEmailDto): Promise<string> {
    const { signupVerifyToken } = dto;

    const command = new VerifyEmailCommand(signupVerifyToken);

    return this.commandBus.execute(command);
  }

  @Post('/login')
  async login(
    @Body() dto: UserLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    // TODO: 비밀번호를 네트워크에서 받는 순간부터 해싱하도록 변경
    const { email, password } = dto;

    const command = new LoginCommand(email, password);

    const accessToken = await this.commandBus.execute(command);
    res.setHeader('Authorization', 'Bearer ' + accessToken);
    res.cookie('access_token', accessToken, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return accessToken;
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  async getUserInfo(@Param('id') userId: string): Promise<UserInfo> {
    const getUserInfoQuery = new GetUserInfoQuery(userId);

    return this.queryBus.execute(getUserInfoQuery);
  }
}
