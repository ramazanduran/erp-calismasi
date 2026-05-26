import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { category?: string; isActive?: boolean }) {
    const where: any = { organizationId };
    if (params.category) where.category = params.category;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return this.prisma.kpiDefinition.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { values: true, targets: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(organizationId: string, id: string) {
    const kpi = await this.prisma.kpiDefinition.findFirst({
      where: { id, organizationId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        values: { orderBy: { period: 'desc' }, take: 24 },
        targets: { orderBy: { period: 'desc' }, take: 12 },
      },
    });
    if (!kpi) throw new NotFoundException('KPI bulunamadı');
    return kpi;
  }

  async create(organizationId: string, data: any) {
    return this.prisma.kpiDefinition.create({ data: { ...data, organizationId } });
  }

  async update(organizationId: string, id: string, data: any) {
    await this.findOne(organizationId, id);
    return this.prisma.kpiDefinition.update({ where: { id }, data });
  }

  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.kpiDefinition.delete({ where: { id } });
  }

  async recordValue(organizationId: string, kpiId: string, userId: string, period: string, value: number, notes?: string) {
    await this.findOne(organizationId, kpiId);
    return this.prisma.kpiValue.upsert({
      where: { kpiId_period: { kpiId, period } },
      update: { value, notes, enteredById: userId },
      create: { kpiId, period, value, notes, enteredById: userId },
    });
  }

  async setTarget(organizationId: string, kpiId: string, period: string, target: number, warning?: number, critical?: number) {
    await this.findOne(organizationId, kpiId);
    return this.prisma.kpiTarget.upsert({
      where: { kpiId_period: { kpiId, period } },
      update: { target, warning, critical },
      create: { kpiId, period, target, warning, critical },
    });
  }

  async getDashboard(organizationId: string, period: string) {
    const kpis = await this.prisma.kpiDefinition.findMany({
      where: { organizationId, isActive: true },
      include: {
        values: {
          where: { period },
          take: 1,
        },
        targets: {
          where: { period },
          take: 1,
        },
      },
    });

    return kpis.map((kpi) => {
      const value = kpi.values[0]?.value ?? null;
      const target = kpi.targets[0]?.target ?? null;
      const warning = kpi.targets[0]?.warning ?? null;
      const critical = kpi.targets[0]?.critical ?? null;

      let status: 'good' | 'warning' | 'critical' | 'no_data' = 'no_data';
      if (value !== null && target !== null) {
        const isHigherBetter = kpi.direction === 'higher_better';
        const ratio = Number(value) / Number(target);
        if (critical !== null) {
          const critRatio = Number(critical) / Number(target);
          if (isHigherBetter ? ratio < critRatio : ratio > critRatio) status = 'critical';
        }
        if (status !== 'critical' && warning !== null) {
          const warnRatio = Number(warning) / Number(target);
          if (isHigherBetter ? ratio < warnRatio : ratio > warnRatio) status = 'warning';
        }
        if (status === 'no_data') status = 'good';
      }

      return { ...kpi, currentValue: value, targetValue: target, status };
    });
  }

  async getTrend(organizationId: string, kpiId: string, periods: number = 12) {
    const kpi = await this.findOne(organizationId, kpiId);
    const values = await this.prisma.kpiValue.findMany({
      where: { kpiId },
      orderBy: { period: 'desc' },
      take: periods,
    });
    const targets = await this.prisma.kpiTarget.findMany({
      where: { kpiId },
      orderBy: { period: 'desc' },
      take: periods,
    });

    const targetMap = Object.fromEntries(targets.map((t) => [t.period, t.target]));
    return {
      kpi,
      trend: values.reverse().map((v) => ({
        period: v.period,
        value: v.value,
        target: targetMap[v.period] ?? null,
      })),
    };
  }
}
