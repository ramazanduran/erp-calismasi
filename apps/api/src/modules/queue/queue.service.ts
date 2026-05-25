import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendWelcomeEmail(to: string, name: string, tempPassword?: string) {
    await this.emailQueue.add('welcome', { to, name, tempPassword });
  }

  async sendPasswordResetEmail(to: string, name: string, tempPassword: string) {
    await this.emailQueue.add('password-reset', { to, name, tempPassword });
  }

  async sendLeaveApprovalEmail(to: string, name: string, status: 'approved' | 'rejected', reason?: string) {
    await this.emailQueue.add('leave-approval', { to, name, status, reason });
  }
}
