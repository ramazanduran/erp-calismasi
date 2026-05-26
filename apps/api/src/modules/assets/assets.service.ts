import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { status?: string; categoryId?: string }) {
    const where: Record<string, unknown> = { organizationId };
    if (params.status) where.status = params.status;
    if (params.categoryId) where.categoryId = params.categoryId;

    return this.prisma.asset.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { maintenances: true, depreciations: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        maintenances: { orderBy: { scheduledAt: 'desc' }, take: 10 },
        depreciations: { orderBy: { period: 'desc' }, take: 12 },
      },
    });
    if (!asset) throw new NotFoundException('Demirbaş bulunamadı');
    return asset;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.asset.create({
      data: { organizationId, ...data } as Parameters<typeof this.prisma.asset.create>[0]['data'],
      include: { category: true },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.asset.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.asset.update>[0]['data'],
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.asset.delete({ where: { id } });
  }

  async calculateDepreciation(id: string, organizationId: string) {
    const asset = await this.findOne(id, organizationId);
    if (!asset.purchaseDate) return [];

    const purchasePrice = Number(asset.purchasePrice);
    const salvageValue = Number(asset.salvageValue);
    const usefulLife = asset.usefulLifeYears;
    const annualDepreciation = (purchasePrice - salvageValue) / usefulLife;
    const monthlyDepreciation = annualDepreciation / 12;

    const startDate = new Date(asset.purchaseDate);
    const schedule = [];
    let bookValue = purchasePrice;

    for (let i = 0; i < usefulLife * 12 && bookValue > salvageValue; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dep = Math.min(monthlyDepreciation, bookValue - salvageValue);
      bookValue = Math.max(bookValue - dep, salvageValue);
      schedule.push({ period, amount: dep, bookValue });
    }

    return schedule;
  }

  async saveDepreciation(id: string, organizationId: string) {
    const schedule = await this.calculateDepreciation(id, organizationId);
    for (const entry of schedule) {
      await this.prisma.assetDepreciation.upsert({
        where: { assetId_period: { assetId: id, period: entry.period } },
        update: { amount: entry.amount, bookValue: entry.bookValue },
        create: { assetId: id, period: entry.period, amount: entry.amount, bookValue: entry.bookValue },
      });
    }
    if (schedule.length > 0) {
      await this.prisma.asset.update({
        where: { id },
        data: { currentValue: schedule[schedule.length - 1].bookValue },
      });
    }
    return { saved: schedule.length };
  }

  async addMaintenance(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.assetMaintenance.create({
      data: { assetId: id, ...data } as Parameters<typeof this.prisma.assetMaintenance.create>[0]['data'],
    });
  }

  async getCategories(organizationId: string) {
    return this.prisma.assetCategory.findMany({
      where: { organizationId },
      include: { _count: { select: { assets: true } } },
    });
  }

  async createCategory(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.assetCategory.create({
      data: { organizationId, ...data } as Parameters<typeof this.prisma.assetCategory.create>[0]['data'],
    });
  }

  async getSummary(organizationId: string) {
    const assets = await this.prisma.asset.findMany({ where: { organizationId } });
    const totalPurchaseValue = assets.reduce((s, a) => s + Number(a.purchasePrice), 0);
    const totalCurrentValue = assets.reduce((s, a) => s + Number(a.currentValue), 0);
    const totalDepreciation = totalPurchaseValue - totalCurrentValue;

    return {
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => a.status === 'active').length,
      totalPurchaseValue,
      totalCurrentValue,
      totalDepreciation,
      depreciationRate: totalPurchaseValue > 0 ? (totalDepreciation / totalPurchaseValue) * 100 : 0,
    };
  }
}
