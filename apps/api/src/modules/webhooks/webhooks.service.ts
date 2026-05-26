import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.webhook.findMany({
      where: { organizationId },
      include: {
        logs: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { logs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId },
      include: {
        logs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!webhook) throw new NotFoundException('Webhook bulunamadı');
    return webhook;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.webhook.create({
      data: { organizationId, ...data } as Parameters<typeof this.prisma.webhook.create>[0]['data'],
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.webhook.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.webhook.update>[0]['data'],
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.webhook.delete({ where: { id } });
  }

  async test(id: string, organizationId: string) {
    const webhook = await this.findOne(id, organizationId);
    const payload = { event: 'test.ping', timestamp: new Date().toISOString(), data: { message: 'ERP Webhook test' } };
    return this.deliver(webhook as { id: string; url: string; secret: string | null; headers: Record<string, string>; retryCount: number }, 'test.ping', payload);
  }

  async dispatchEvent(organizationId: string, event: string, data: unknown) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId, isActive: true, events: { has: event } },
    });

    const payload = { event, timestamp: new Date().toISOString(), data };

    for (const wh of webhooks) {
      this.deliver(
        wh as { id: string; url: string; secret: string | null; headers: Record<string, string>; retryCount: number },
        event,
        payload
      ).catch((e) => this.logger.error(`Webhook delivery failed: ${e.message}`));
    }
  }

  private async deliver(
    webhook: { id: string; url: string; secret: string | null; headers: Record<string, string>; retryCount: number },
    event: string,
    payload: unknown,
  ) {
    const body = JSON.stringify(payload);
    const signature = webhook.secret
      ? 'sha256=' + crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')
      : undefined;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-ERP-Event': event,
      'X-ERP-Delivery': crypto.randomUUID(),
      ...(webhook.headers as Record<string, string>),
      ...(signature ? { 'X-ERP-Signature': signature } : {}),
    };

    let statusCode: number | undefined;
    let response: string | undefined;
    let error: string | undefined;

    try {
      const res = await fetch(webhook.url, { method: 'POST', headers, body });
      statusCode = res.status;
      response = await res.text().catch(() => undefined) ?? undefined;
    } catch (e) {
      error = (e as Error).message;
    }

    await this.prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload as Record<string, unknown>,
        statusCode,
        response,
        error,
        deliveredAt: statusCode && statusCode < 400 ? new Date() : undefined,
      },
    });

    return { statusCode, response, error };
  }

  async getLogs(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.webhookLog.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
