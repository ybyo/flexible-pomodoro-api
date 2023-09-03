import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parse } from 'cookie';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      `https://${process.env.HOST_URL}`,
      `https://${process.env.HOST_URL}:${process.env.FRONT_PORT_0}`,
      `https://${process.env.HOST_URL}:${process.env.FRONT_PORT_2}`,
    ],
    credentials: true,
  },
})
export class TimerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  afterInit(server: Server) {
    if (process.env.NODE_ENV === 'development') {
      console.log('WebSocket Initialized');
      console.log(server._opts);
    }
  }

  handleConnection(client: Socket, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Client connected: ${client.id}`);
    }

    const accessToken = parse(client.handshake.headers.cookie)['accessToken'];
    const jwtConfig = this.configService.get('jwt');
    try {
      const decoded = this.jwtService.verify(accessToken, jwtConfig);
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  handleDisconnect(client: Socket) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('startTimer')
  handleStartTimer(client: Socket, payload: { startTimer: string }): void {
    console.log(`Start Timer... ${payload.startTimer}`);
  }

  @SubscribeMessage('stopTimer')
  handleStopTimer(client: Socket, payload: { stopTimer: string }): void {
    console.log(`Stop Timer... ${payload.stopTimer}`);
  }
}
