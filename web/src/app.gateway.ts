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
import { firstValueFrom } from 'rxjs';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, getConnection } from 'typeorm';
import { Kafka } from 'kafkajs';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');
  private kafka = new Kafka({
    clientId: 'web',
    brokers: [process.env.KAFKA_URL],
  });
  private consumer = this.kafka.consumer({ groupId: 'process.payload.reply' });
  private producer = this.kafka.producer();

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: string): Promise<void> {
    await this.producer.send({ 
      topic: 'process.payload',
      messages: [{ value: payload }],
    })
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
    console.log('xcvoiu', 'Line #53 app.gateway.ts');
    
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'process.payload.reply', fromBeginning: false });
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        this.logger.log(`Got message from ${topic}`);
        console.log(message.value.toString(), 'Line #62 app.gateway.ts');
        const res = JSON.parse(message.value.toString());
        if (res.length == 0) {
          this.server.emit('message', JSON.stringify(['Untranslatable']));
          this.logger.log(`Message detail ${message.value}`);
        } else {
          const sockets = [];
          for (let i = 0; i < res.length; i += 2) {
            if (res[i] && res[i + 1]) {
              try {
                const data = JSON.stringify(await getConnection(res[i]).query(res[i + 1]));
                sockets.push(`Found schema: ${res[i]}. Query: ${res[i + 1]}. Data: ${data.substring(0, 100)}...`)
              } catch (err) {
                sockets.push(`Found schema: ${res[i]}. Query: ${res[i + 1]}. Data: Error: ${err.message}!!!`)
              }
            }
          }
          this.server.emit('message', JSON.stringify(sockets));
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}
