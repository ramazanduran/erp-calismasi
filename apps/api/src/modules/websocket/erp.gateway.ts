import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws',
})
export class ErpGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ErpGateway.name);
  private connectedClients = new Map<string, { socket: Socket; userId: string; organizationId: string }>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; organizationId: string; token: string }
  ) {
    client.join(`org_${data.organizationId}`);
    client.join(`user_${data.userId}`);
    this.connectedClients.set(client.id, {
      socket: client,
      userId: data.userId,
      organizationId: data.organizationId,
    });
    return { event: 'joined', data: { status: 'ok' } };
  }

  emitToOrganization(organizationId: string, event: string, data: unknown) {
    this.server.to(`org_${organizationId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user_${userId}`).emit(event, data);
  }
}
