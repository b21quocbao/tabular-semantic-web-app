import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, getConnection } from 'typeorm';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @Inject('APPS_SERVICE') private client: ClientKafka;
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: string): Promise<void> {
    console.log(payload, 'Line #28 app.gateway.ts');
    // const x = await getConnection('sakila_1').query('Select * from users');
    const processedPayload = await firstValueFrom(
      this.client.send('process.payload', payload),
    );
    this.server.emit('message', processedPayload);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async onModuleInit() {
    this.client.subscribeToResponseOf('process.payload');
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
