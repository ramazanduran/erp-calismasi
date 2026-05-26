import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  private generateContractNumber(type: string) {
    const prefix = type.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const ts = Date.now().toString(36).toUpperCase().slice(-5);
    return `CNT-${prefix}-${year}-${ts}`;
  }

  async findAll(organizationId: string, params: { status?: string; type?: string; search?: string }) {
    const where: any = { organizationId };
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { contractNumber: { contains: params.search, mode: 'insensitive' } },
        { partyName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.contract.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { amendments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        supplier: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        amendments: {
          include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { amendmentNo: 'asc' },
        },
      },
    });
    if (!contract) throw new NotFoundException('Kontrat bulunamadı');
    return contract;
  }

  async create(organizationId: string, userId: string, data: any) {
    return this.prisma.contract.create({
      data: {
        ...data,
        organizationId,
        ownerId: userId,
        contractNumber: this.generateContractNumber(data.type ?? 'general'),
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    await this.findOne(organizationId, id);
    const updateData: any = { ...data };
    if (data.status === 'active' && !data.signedAt) updateData.signedAt = new Date();
    return this.prisma.contract.update({ where: { id }, data: updateData });
  }

  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.contract.delete({ where: { id } });
  }

  async addAmendment(organizationId: string, contractId: string, userId: string, data: any) {
    await this.findOne(organizationId, contractId);
    const lastAmendment = await this.prisma.contractAmendment.findFirst({
      where: { contractId },
      orderBy: { amendmentNo: 'desc' },
    });
    return this.prisma.contractAmendment.create({
      data: {
        ...data,
        contractId,
        createdById: userId,
        amendmentNo: (lastAmendment?.amendmentNo ?? 0) + 1,
      },
    });
  }

  async getExpiring(organizationId: string, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return this.prisma.contract.findMany({
      where: {
        organizationId,
        status: 'active',
        endDate: { lte: cutoff, gte: new Date() },
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async getStats(organizationId: string) {
    const [total, byStatus, byType, totalValue] = await Promise.all([
      this.prisma.contract.count({ where: { organizationId } }),
      this.prisma.contract.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.contract.groupBy({
        by: ['type'],
        where: { organizationId },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.contract.aggregate({
        where: { organizationId, status: 'active' },
        _sum: { value: true },
      }),
    ]);

    return {
      total,
      active: byStatus.find((s) => s.status === 'active')?._count._all ?? 0,
      totalActiveValue: totalValue._sum.value ?? 0,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      byType: Object.fromEntries(byType.map((t) => [t.type, { count: t._count._all, value: t._sum.value ?? 0 }])),
    };
  }
}
