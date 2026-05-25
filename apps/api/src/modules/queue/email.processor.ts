import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { EmailService } from '../notifications/email.service';

@Processor('email')
@Injectable()
export class EmailProcessor {
  constructor(private emailService: EmailService) {}

  @Process('welcome')
  async handleWelcome(job: Job<{ to: string; name: string; tempPassword?: string }>) {
    await this.emailService.sendWelcomeEmail(job.data.to, job.data.name, job.data.tempPassword);
  }

  @Process('password-reset')
  async handlePasswordReset(job: Job<{ to: string; name: string; tempPassword: string }>) {
    await this.emailService.sendPasswordResetEmail(job.data.to, job.data.name, job.data.tempPassword);
  }

  @Process('leave-approval')
  async handleLeaveApproval(job: Job<{ to: string; name: string; status: 'approved' | 'rejected'; reason?: string }>) {
    await this.emailService.sendLeaveApprovalEmail(job.data.to, job.data.name, job.data.status, job.data.reason);
  }
}
