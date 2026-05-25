import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email.processor';
import { QueueService } from './queue.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'email' }),
    NotificationsModule,
  ],
  providers: [EmailProcessor, QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
