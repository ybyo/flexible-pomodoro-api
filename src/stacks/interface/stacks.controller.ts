import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '@/type-defs/message.interface';
import { GetStacksCommand } from '@/stacks/application/command/impl/get-stacks.command';
import { SaveStacksCommand } from '@/stacks/application/command/impl/save-stacks.command';
import { RemoveStacksCommand } from '@/stacks/application/command/impl/remove-stacks.command';

@Controller('stacks')
export class StacksController {
  constructor(private readonly commandBus: CommandBus) {}
  @UseGuards(JwtAuthGuard)
  @Get('fetch')
  // TODO: 응답 타입 정의
  async fetch(@Req() req) {
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
  async save(@Req() req, @Body() stacks) {
    const user = req.user as JwtPayload & IUser;

    const command = new SaveStacksCommand(user.id, stacks);
    const result = await this.commandBus.execute(command);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('remove')
  async remove(@Body() id) {
    const command = new RemoveStacksCommand(Object.keys(id)[0]);
    const result = await this.commandBus.execute(command);

    return result;
  }
}
