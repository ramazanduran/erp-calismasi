import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const STAGE_ORDER = ['qualification', 'proposal', 'negotiation', 'won', 'lost'];

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { stage?: string; assignedUserId?: string; customerId?: string }) {
    const where: Record<string, unknown> = { organizationId };
    if (params.stage) where.stage = params.stage;
    if (params.assignedUserId) where.assignedUserId = params.assignedUserId;
    if (params.customerId) where.customerId = params.customerId;

    const deals = await this.prisma.deal.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return deals;
  }

  async getPipeline(organizationId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { organizationId, stage: { notIn: ['won', 'lost'] } },
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const pipeline = STAGE_ORDER.map((stage) => ({
      stage,
      deals: deals.filter((d) => d.stage === stage),
      totalValue: deals.filter((d) => d.stage === stage).reduce((s, d) => s + Number(d.value), 0),
      count: deals.filter((d) => d.stage === stage).length,
    }));

    return pipeline;
  }

  async findOne(id: string, organizationId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!deal) throw new NotFoundException('Fırsat bulunamadı');
    return deal;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.deal.create({
      data: { organizationId, ...data } as Parameters<typeof this.prisma.deal.create>[0]['data'],
      include: { customer: true, activities: true },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    const updateData = { ...data } as Record<string, unknown>;
    if (data.stage === 'won' || data.stage === 'lost') {
      updateData.closedAt = new Date();
    }
    return this.prisma.deal.update({
      where: { id },
      data: updateData as Parameters<typeof this.prisma.deal.update>[0]['data'],
      include: { customer: true, activities: true },
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.deal.delete({ where: { id } });
  }

  async addActivity(dealId: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(dealId, organizationId);
    return this.prisma.dealActivity.create({
      data: { dealId, ...data } as Parameters<typeof this.prisma.dealActivity.create>[0]['data'],
    });
  }

  async completeActivity(activityId: string, dealId: string, organizationId: string) {
    await this.findOne(dealId, organizationId);
    return this.prisma.dealActivity.update({
      where: { id: activityId },
      data: { completedAt: new Date() },
    });
  }

  async getStats(organizationId: string) {
    const [all, won, lost] = await Promise.all([
      this.prisma.deal.findMany({ where: { organizationId } }),
      this.prisma.deal.findMany({ where: { organizationId, stage: 'won' } }),
      this.prisma.deal.findMany({ where: { organizationId, stage: 'lost' } }),
    ]);

    const totalValue = all.reduce((s, d) => s + Number(d.value), 0);
    const wonValue = won.reduce((s, d) => s + Number(d.value), 0);
    const avgDealSize = all.length > 0 ? totalValue / all.length : 0;
    const winRate = all.length > 0 ? (won.length / (won.length + lost.length || 1)) * 100 : 0;

    return {
      totalDeals: all.length,
      totalValue,
      wonDeals: won.length,
      wonValue,
      lostDeals: lost.length,
      avgDealSize,
      winRate,
      openDeals: all.filter((d) => !['won', 'lost'].includes(d.stage)).length,
    };
  }
}
