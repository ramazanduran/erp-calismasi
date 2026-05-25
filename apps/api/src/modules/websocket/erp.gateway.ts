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
import { JwtService } from '@nestjs/jwt';
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

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || (client.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');
    if (token) {
      try {
        const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
        (client as Socket & { user: unknown }).user = payload;
        this.logger.log(`Client connected: ${client.id} (user: ${(payload as Record<string, unknown>).sub})`);
      } catch {
        client.disconnect();
      }
    } else {
      this.logger.log(`Client connected (anonymous): ${client.id}`);
    }
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
