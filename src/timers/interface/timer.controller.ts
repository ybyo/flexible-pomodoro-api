import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { GetTimerCommand } from '@/timers/application/command/impl/get-timer.command';
import { IRes, IUser } from '@/type-defs/message.interface';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { JwtPayload } from 'jsonwebtoken';
import { Request } from 'express';
import { SaveTimerCommand } from '@/timers/application/command/impl/save-timer.command';
import { Timer } from '@/timers/domain/timer.model';

@Controller('timer')
export class TimerController {
  constructor(private readonly commandBus: CommandBus) {}

  @UseGuards(JwtAuthGuard)
  @Get('fetch')
  async fetch(@Req() req: Request): Promise<Timer[]> {
    const user = req.user as JwtPayload & IUser;
    const command = new GetTimerCommand(user.id);

    return await this.commandBus.execute(command);
  }

  @UseGuards(JwtAuthGuard)
  @Post('save')
  async commit(@Req() req: Request, @Body() timer: Timer[]): Promise<IRes> {
    const user = req.user as JwtPayload & IUser;
    const command = new SaveTimerCommand(user.id, timer);

    return await this.commandBus.execute(command);
  }

  // TODO: 404페이지 구현하기
}
