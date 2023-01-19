import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { GetFragsCommand } from '@/frags/application/command/impl/get-frags.command';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '@/type-defs/message.interface';
import { Frag } from '@/frags/domain/frag.model';
import { SaveFragCommand } from '@/frags/application/command/impl/save-frag.command';

@Controller('frag')
export class FragController {
  constructor(
    private readonly authService: AuthService,
    private readonly commandBus: CommandBus,
  ) {}
  @UseGuards(JwtAuthGuard)
  @Get('fetch')
  // TODO: 응답 타입 정의
  async fetch(@Req() req: Request) {
    // 인증까지 완료된 상황
    // TODO: 커맨드 필요(커맨드 핸들러, 커맨드 생성기)
    const user = req.user as JwtPayload & IUser;

    let frags;

    if ('id' in user) {
      const command = new GetFragsCommand(user.id);
      frags = await this.commandBus.execute(command);
    }

    return frags;
  }

  @UseGuards(JwtAuthGuard)
  @Post('commit')
  async commit(@Req() req: Request, @Body() frags: Frag[]) {
    const user = req.user as JwtPayload & IUser;

    const command = new SaveFragCommand(user.id, frags);
    const result = await this.commandBus.execute(command);

    return result;
  }

  // TODO: 404페이지 구현하기
}
