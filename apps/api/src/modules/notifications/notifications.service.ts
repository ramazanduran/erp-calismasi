import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, organizationId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, organizationId, ...(unreadOnly && { isRead: false }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, organizationId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, organizationId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async create(data: { organizationId: string; userId: string; type: string; title: string; body?: string; data?: Record<string, unknown> }) {
    return this.prisma.notification.create({ data });
  }

  async getUnreadCount(userId: string, organizationId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, organizationId, isRead: false },
    });
    return { count };
  }
}
