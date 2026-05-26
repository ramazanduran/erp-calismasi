import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { status?: string; departmentId?: string; year?: number }) {
    const where: Record<string, unknown> = { organizationId };
    if (params.status) where.status = params.status;
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.year) {
      where.startDate = { gte: new Date(`${params.year}-01-01`) };
    }

    return this.prisma.budget.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        lines: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, organizationId },
      include: {
        department: { select: { id: true, name: true } },
        lines: { orderBy: { category: 'asc' } },
      },
    });
    if (!budget) throw new NotFoundException('Bütçe bulunamadı');
    return budget;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    const { lines, ...budgetData } = data;
    const totalAmount = Array.isArray(lines)
      ? lines.reduce((sum: number, l: Record<string, unknown>) => sum + Number(l.plannedAmount ?? 0), 0)
      : 0;

    return this.prisma.budget.create({
      data: {
        organizationId,
        ...budgetData,
        totalAmount,
        lines: Array.isArray(lines)
          ? { create: lines.map((l: Record<string, unknown>) => ({ ...l })) }
          : undefined,
      } as Parameters<typeof this.prisma.budget.create>[0]['data'],
      include: { lines: true, department: true },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    const { lines, ...budgetData } = data;

    if (Array.isArray(lines)) {
      await this.prisma.budgetLine.deleteMany({ where: { budgetId: id } });
      const totalAmount = lines.reduce((sum: number, l: Record<string, unknown>) => sum + Number(l.plannedAmount ?? 0), 0);
      await this.prisma.budgetLine.createMany({
        data: lines.map((l: Record<string, unknown>) => ({ ...l, budgetId: id }) as Parameters<typeof this.prisma.budgetLine.createMany>[0]['data'][number]),
      });
      budgetData.totalAmount = totalAmount;
    }

    return this.prisma.budget.update({
      where: { id },
      data: budgetData as Parameters<typeof this.prisma.budget.update>[0]['data'],
      include: { lines: true, department: true },
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.budget.delete({ where: { id } });
  }

  async updateLineActual(lineId: string, budgetId: string, organizationId: string, actualAmount: number) {
    await this.findOne(budgetId, organizationId);
    return this.prisma.budgetLine.update({
      where: { id: lineId },
      data: { actualAmount },
    });
  }

  async getSummary(organizationId: string, year?: number) {
    const where: Record<string, unknown> = { organizationId };
    if (year) {
      where.startDate = { gte: new Date(`${year}-01-01`) };
      where.endDate = { lte: new Date(`${year}-12-31`) };
    }

    const budgets = await this.prisma.budget.findMany({
      where: { ...where, status: 'active' },
      include: { lines: true },
    });

    const totalPlanned = budgets.reduce((s, b) => s + Number(b.totalAmount), 0);
    const totalActual = budgets.reduce(
      (s, b) => s + b.lines.reduce((ls, l) => ls + Number(l.actualAmount), 0),
      0
    );

    const byCategory = new Map<string, { planned: number; actual: number }>();
    for (const b of budgets) {
      for (const l of b.lines) {
        const entry = byCategory.get(l.category) ?? { planned: 0, actual: 0 };
        entry.planned += Number(l.plannedAmount);
        entry.actual += Number(l.actualAmount);
        byCategory.set(l.category, entry);
      }
    }

    return {
      totalPlanned,
      totalActual,
      variance: totalPlanned - totalActual,
      utilizationRate: totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0,
      budgetCount: budgets.length,
      byCategory: Array.from(byCategory.entries()).map(([category, v]) => ({ category, ...v })),
    };
  }
}
