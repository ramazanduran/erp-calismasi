import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  private generateRequestNumber() {
    const year = new Date().getFullYear();
    const ts = Date.now().toString(36).toUpperCase().slice(-5);
    return `MNT-${year}-${ts}`;
  }

  async findAll(organizationId: string, params: { status?: string; priority?: string; category?: string }) {
    const where: any = { organizationId };
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.category) where.category = params.category;

    return this.prisma.maintenanceRequest.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        asset: { select: { id: true, name: true, code: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(organizationId: string, id: string) {
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: { id, organizationId },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        asset: { select: { id: true, name: true, code: true, location: true } },
        comments: {
          include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!request) throw new NotFoundException('Bakım isteği bulunamadı');
    return request;
  }

  async create(organizationId: string, userId: string, data: any) {
    return this.prisma.maintenanceRequest.create({
      data: {
        ...data,
        organizationId,
        requestedById: userId,
        requestNumber: this.generateRequestNumber(),
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    await this.findOne(organizationId, id);
    const current = await this.prisma.maintenanceRequest.findUnique({ where: { id } });
    const updateData: any = { ...data };
    if (data.status === 'in_progress' && !current?.startedAt) updateData.startedAt = new Date();
    if (data.status === 'completed' && !current?.completedAt) updateData.completedAt = new Date();
    return this.prisma.maintenanceRequest.update({ where: { id }, data: updateData });
  }

  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.maintenanceRequest.delete({ where: { id } });
  }

  async addComment(organizationId: string, requestId: string, userId: string, data: { content: string; isInternal?: boolean }) {
    await this.findOne(organizationId, requestId);
    return this.prisma.maintenanceComment.create({
      data: { requestId, authorId: userId, content: data.content, isInternal: data.isInternal ?? false },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  async getStats(organizationId: string) {
    const [total, byStatus, byPriority, avgResolutionTime] = await Promise.all([
      this.prisma.maintenanceRequest.count({ where: { organizationId } }),
      this.prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.maintenanceRequest.groupBy({
        by: ['priority'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<[{ avg_hours: number }]>`
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::float AS avg_hours
        FROM maintenance_requests
        WHERE organization_id = ${organizationId}::uuid
          AND status = 'completed'
          AND completed_at IS NOT NULL
      `.catch(() => [{ avg_hours: 0 }]),
    ]);

    const open = byStatus.find((s) => s.status === 'open')?._count._all ?? 0;
    const critical = byPriority.find((p) => p.priority === 'critical')?._count._all ?? 0;

    return {
      total,
      open,
      critical,
      avgResolutionHours: Math.round((avgResolutionTime[0]?.avg_hours ?? 0) * 10) / 10,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count._all])),
    };
  }
}
