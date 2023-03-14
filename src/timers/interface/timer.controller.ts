import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { GetTimerCommand } from '@/timers/application/command/impl/get-timer.command';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '@/type-defs/message.interface';
import { Timer } from '@/timers/domain/timer.model';
import { SaveTimerCommand } from '@/timers/application/command/impl/save-timer.command';

@Controller('timer')
export class TimerController {
  constructor(private readonly commandBus: CommandBus) {}
  @UseGuards(JwtAuthGuard)
  @Get('fetch')
  // TODO: 응답 타입 정의
  async fetch(@Req() req: Request) {
    const user = req.user as JwtPayload & IUser;

    let timer;

    if ('id' in user) {
      const command = new GetTimerCommand(user.id);
      timer = await this.commandBus.execute(command);
    }

    return timer;
  }

  @UseGuards(JwtAuthGuard)
  @Post('save')
  async commit(@Req() req: Request, @Body() timer: Timer[]) {
    const user = req.user as JwtPayload & IUser;

    const command = new SaveTimerCommand(user.id, timer);
    const result = await this.commandBus.execute(command);

    return result;
  }

  // TODO: 404페이지 구현하기
}
