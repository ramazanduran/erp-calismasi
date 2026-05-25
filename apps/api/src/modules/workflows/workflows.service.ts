import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.workflow.findMany({
      where: { organizationId },
      include: {
        _count: { select: { instances: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
      include: {
        instances: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: { select: { instances: true } },
      },
    });
    if (!workflow) throw new NotFoundException('İş akışı bulunamadı');
    return workflow;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.workflow.create({
      data: { organizationId, ...data } as Parameters<typeof this.prisma.workflow.create>[0]['data'],
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOneBasic(id, organizationId);
    return this.prisma.workflow.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.workflow.update>[0]['data'],
    });
  }

  async toggle(id: string, organizationId: string) {
    const workflow = await this.findOneBasic(id, organizationId);
    return this.prisma.workflow.update({
      where: { id },
      data: { isActive: !workflow.isActive },
    });
  }

  async getInstances(workflowId: string, organizationId: string) {
    await this.findOneBasic(workflowId, organizationId);
    return this.prisma.workflowInstance.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  private async findOneBasic(id: string, organizationId: string) {
    const workflow = await this.prisma.workflow.findFirst({ where: { id, organizationId } });
    if (!workflow) throw new NotFoundException('İş akışı bulunamadı');
    return workflow;
  }
}
