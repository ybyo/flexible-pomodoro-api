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
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LoginUserDto } from '@/users/interface/dto/login-user.dto';
import { AuthService } from '@/auth/auth.service';
import { RegisterUserDto } from '@/users/interface/dto/register-user.dto';
import { LocalGuard } from '@/auth/guard/local.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import {
  IErrorResponse,
  IGeneralResponse,
  IUser,
} from '@/type-defs/message.interface';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(Logger) private readonly logger: LoggerService,
    private authService: AuthService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post('register')
  registerUser(@Body() user: RegisterUserDto) {
    return this.authService.registerUser(user);
  }

  @UseGuards(LocalGuard)
  @Post('login')
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const user = await this.authService.validateUser(dto);

    await this.authService.issueCookie(user, res);
  }

  @Get('me')
  async getUserInfoWithAccessToken(
    @Req() request: Request,
  ): Promise<IGeneralResponse<IUser> | IErrorResponse> {
    const jwtString = request.cookies['accessToken'];

    if (!jwtString) {
      throw new UnauthorizedException('No access token');
    } else {
      const result = await this.authService.verify(jwtString);
      if (result.success) {
        return result;
      } else {
        result.data = null;
        throw new ForbiddenException(result);
      }
    }
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    await this.authService.logoutUser(response);
  }

  @Get('refresh')
  async refreshAuth(
    @Req() request: Request,
    @Res({ passthrough: false }) response: Response,
  ) {
    const jwtString = request.cookies['accessToken'];

    if (!jwtString) {
      throw new UnauthorizedException('No access token');
    }

    const result = await this.authService.verify(jwtString);

    if (result.success === false) {
      const user = result.data;
      if (result.message === 'jwt expired') {
        console.log('cookie reissued');
        await this.authService.issueCookie(user, response);
      } else {
        console.log('invalid token');
        throw new UnauthorizedException('invalid token');
      }
    }
  }

  @Get(':userId')
  async getUserInfoWithUserId(@Param('userId') userId: string): Promise<IUser> {
    // const getUserInfoQuery = new GetUserByUserId(userId);
    //
    // return this.queryBus.execute(getUserInfoQuery);
    return this.authService.findByUserId(userId);
  }
}
