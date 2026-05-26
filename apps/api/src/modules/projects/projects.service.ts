import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { status?: string; customerId?: string }) {
    const where: Record<string, unknown> = { organizationId };
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;

    return this.prisma.project.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        members: true,
        _count: { select: { tasks: true, milestones: true, timeEntries: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, name: true } },
        members: true,
        milestones: { orderBy: { dueDate: 'asc' } },
        tasks: {
          where: { parentId: null },
          include: { subtasks: true, milestone: { select: { id: true, name: true } } },
          orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }],
        },
      },
    });
    if (!project) throw new NotFoundException('Proje bulunamadı');
    return project;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    const code = data.code as string || await this.generateCode(organizationId);
    return this.prisma.project.create({
      data: { organizationId, code, ...data } as Parameters<typeof this.prisma.project.create>[0]['data'],
      include: { customer: true },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.project.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.project.update>[0]['data'],
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.project.delete({ where: { id } });
  }

  async getBoard(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    const tasks = await this.prisma.projectTask.findMany({
      where: { projectId: id, parentId: null },
      include: {
        subtasks: { include: { timeEntries: true } },
        milestone: { select: { id: true, name: true } },
        timeEntries: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const columns = ['todo', 'in_progress', 'review', 'done', 'blocked'];
    return columns.map((status) => ({
      status,
      tasks: tasks.filter((t) => t.status === status),
    }));
  }

  async createTask(projectId: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(projectId, organizationId);
    return this.prisma.projectTask.create({
      data: { projectId, ...data } as Parameters<typeof this.prisma.projectTask.create>[0]['data'],
    });
  }

  async updateTask(taskId: string, projectId: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(projectId, organizationId);
    const updateData = { ...data } as Record<string, unknown>;
    if (data.status === 'done') updateData.completedAt = new Date();
    return this.prisma.projectTask.update({
      where: { id: taskId },
      data: updateData as Parameters<typeof this.prisma.projectTask.update>[0]['data'],
    });
  }

  async deleteTask(taskId: string, projectId: string, organizationId: string) {
    await this.findOne(projectId, organizationId);
    return this.prisma.projectTask.delete({ where: { id: taskId } });
  }

  async createMilestone(projectId: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(projectId, organizationId);
    return this.prisma.projectMilestone.create({
      data: { projectId, ...data } as Parameters<typeof this.prisma.projectMilestone.create>[0]['data'],
    });
  }

  async logTime(projectId: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(projectId, organizationId);
    const entry = await this.prisma.timeEntry.create({
      data: { projectId, ...data } as Parameters<typeof this.prisma.timeEntry.create>[0]['data'],
    });

    if (data.taskId) {
      await this.prisma.projectTask.update({
        where: { id: data.taskId as string },
        data: { loggedHours: { increment: Number(data.hours) } },
      });
    }
    return entry;
  }

  async getStats(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      include: { _count: { select: { tasks: true } } },
    });

    const byStatus = projects.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});

    const totalHours = await this.prisma.timeEntry.aggregate({
      where: { project: { organizationId } },
      _sum: { hours: true },
    });

    return {
      total: projects.length,
      byStatus,
      active: projects.filter((p) => p.status === 'active').length,
      totalLoggedHours: Number(totalHours._sum.hours ?? 0),
    };
  }

  private async generateCode(organizationId: string) {
    const count = await this.prisma.project.count({ where: { organizationId } });
    return `PRJ-${String(count + 1).padStart(4, '0')}`;
  }
}
