import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '@/type-defs/message.interface';
import { GetStacksCommand } from '@/stacks/application/command/impl/get-stacks.command';
import { SaveStacksCommand } from '@/stacks/application/command/impl/save-stacks.command';
import { Stacks } from '@/stacks/domain/stacks.model';

@Controller('stacks')
export class StacksController {
  constructor(private readonly commandBus: CommandBus) {}
  @UseGuards(JwtAuthGuard)
  @Get('fetch')
  // TODO: 응답 타입 정의
  async fetch(@Req() req: Request) {
    const user = req.user as JwtPayload & IUser;

    let stacks;

    if ('id' in user) {
      const command = new GetStacksCommand(user.id);
      stacks = await this.commandBus.execute(command);
    }

    return stacks;
  }

  @UseGuards(JwtAuthGuard)
  @Post('save')
  async save(@Req() req: Request, @Body() stacks: Stacks) {
    const user = req.user as JwtPayload & IUser;

    const command = new SaveStacksCommand(user.id, stacks);
    const result = await this.commandBus.execute(command);

    return result;
  }
}
