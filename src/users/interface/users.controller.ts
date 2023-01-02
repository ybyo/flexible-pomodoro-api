import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Logger,
  LoggerService,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guard/auth.guard';
import { AuthService } from '@/auth/auth.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/command/create-user.command';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserInfoQuery } from '../application/query/get-user-info.query';
import {
  IGeneralResponse,
  IErrorResponse,
  IUser,
} from '@/typeDefs/message.interface';
import { LoginCommand } from '../application/command/login.command';
import { Response, Request } from 'express';
import { UserLoginDto } from './dto/user-login.dto';
import { VerifyEmailCommand } from '../application/command/verify-email.command';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(Logger) private readonly logger: LoggerService,
    private authService: AuthService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
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
  ): Promise<void> {
    // TODO: 비밀번호를 네트워크에서 받는 순간부터 해싱하도록 변경
    const { email, password } = dto;

    const command = new LoginCommand(email, password);

    // TODO: accessToken 제거
    const userPayload = await this.commandBus.execute(command);

    this.authService.issueCookie(userPayload, res);
  }

  @Get('/me')
  async getUserInfoWithAccessToken(
    @Req() request: Request,
    // @Res({ passthrough: true }) response: Response,
  ): Promise<IGeneralResponse<IUser> | IErrorResponse> {
    const jwtString = request.cookies['accessToken'];

    if (!jwtString) {
      throw new UnauthorizedException('No access token');
    } else {
      const result = this.authService.verify(jwtString);
      if (result.success) {
        return result;
      } else {
        result.data = null;
        throw new ForbiddenException(result);
      }
    }
  }

  @Get('/auth/refresh')
  async refreshAuth(
    @Req() request: Request,
    @Res({ passthrough: false }) response: Response,
  ) {
    const jwtString = request.cookies['accessToken'];

    if (!jwtString) {
      throw new UnauthorizedException('No access token');
    }

    const result = this.authService.verify(jwtString);

    if (result.success === false) {
      const user = result.data;
      if (result.message === 'jwt expired') {
        console.log('cookie reissued');
        this.authService.issueCookie(user, response);
      } else {
        console.log('invalid token');
        throw new UnauthorizedException('invalid token');
      }
    }
  }

  @Get('/logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    this.authService.logout(response);
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  async getUserInfoWithuserId(@Param('id') userId: string): Promise<IUser> {
    const getUserInfoQuery = new GetUserInfoQuery(userId);

    return this.queryBus.execute(getUserInfoQuery);
  }
}
