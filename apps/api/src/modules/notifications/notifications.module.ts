import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
