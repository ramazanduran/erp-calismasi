import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { assignedToId?: string; status?: string; priority?: string; entityType?: string; entityId?: string } = {}) {
    return this.prisma.task.findMany({
      where: { organizationId, ...params },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async findOne(id: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({ where: { id, organizationId } });
    if (!task) throw new NotFoundException('Görev bulunamadı');
    return task;
  }

  async create(organizationId: string, userId: string, data: Record<string, unknown>) {
    return this.prisma.task.create({ data: { organizationId, createdById: userId, ...data } as any });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.task.update({ where: { id }, data: data as any });
  }

  async complete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.task.update({ where: { id }, data: { status: 'done', completedAt: new Date() } });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.task.delete({ where: { id } });
  }
}
