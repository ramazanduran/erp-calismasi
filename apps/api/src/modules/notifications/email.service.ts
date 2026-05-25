import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string, tempPassword?: string) {
    await this.sendMail({
      to,
      subject: 'ERP Sistemine Hoşgeldiniz',
      html: this.welcomeTemplate(name, tempPassword),
    });
  }

  async sendPasswordResetEmail(to: string, name: string, tempPassword: string) {
    await this.sendMail({
      to,
      subject: 'Şifre Sıfırlama',
      html: this.passwordResetTemplate(name, tempPassword),
    });
  }

  async sendLeaveApprovalEmail(
    to: string,
    name: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) {
    await this.sendMail({
      to,
      subject: `İzin Talebi ${status === 'approved' ? 'Onaylandı' : 'Reddedildi'}`,
      html: this.leaveStatusTemplate(name, status, reason),
    });
  }

  private async sendMail(options: { to: string; subject: string; html: string }) {
    try {
      const from = this.config.get('SMTP_FROM', '"ERP System" <noreply@erp.com>');
      await this.transporter.sendMail({ from, ...options });
    } catch (err) {
      this.logger.error('E-posta gönderilemedi', err);
    }
  }

  private welcomeTemplate(name: string, tempPassword?: string): string {
    return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Hoşgeldiniz, ${name}!</h2>
      <p>ERP sistemine hesabınız oluşturuldu.</p>
      ${tempPassword ? `<p>Geçici şifreniz: <strong>${tempPassword}</strong></p><p>İlk girişten sonra şifrenizi değiştirmeyi unutmayın.</p>` : ''}
    </div>`;
  }

  private passwordResetTemplate(name: string, tempPassword: string): string {
    return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Şifre Sıfırlama</h2>
      <p>Merhaba ${name}, yeni geçici şifreniz: <strong>${tempPassword}</strong></p>
    </div>`;
  }

  private leaveStatusTemplate(name: string, status: string, reason?: string): string {
    return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>İzin Talebi Güncellendi</h2>
      <p>Merhaba ${name}, izin talebiniz <strong>${status === 'approved' ? 'onaylandı' : 'reddedildi'}</strong>.</p>
      ${reason ? `<p>Not: ${reason}</p>` : ''}
    </div>`;
  }
}
