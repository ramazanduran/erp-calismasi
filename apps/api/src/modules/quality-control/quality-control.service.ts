import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QualityControlService {
  constructor(private prisma: PrismaService) {}

  private generateNumber(prefix = 'QI') {
    const ts = Date.now().toString(36).toUpperCase();
    return `${prefix}-${ts}`;
  }

  async findAll(organizationId: string, params: { status?: string; type?: string; limit?: number; offset?: number }) {
    const where: any = { organizationId };
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    const [items, total] = await Promise.all([
      this.prisma.qualityInspection.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, code: true } },
          inspector: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { checkItems: true, defects: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.qualityInspection.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(organizationId: string, id: string) {
    const inspection = await this.prisma.qualityInspection.findFirst({
      where: { id, organizationId },
      include: {
        product: { select: { id: true, name: true, code: true } },
        inspector: { select: { id: true, firstName: true, lastName: true } },
        checkItems: { orderBy: { sortOrder: 'asc' } },
        defects: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!inspection) throw new NotFoundException('Muayene bulunamadı');
    return inspection;
  }

  async create(organizationId: string, data: any) {
    const { checkItems, ...rest } = data;
    return this.prisma.qualityInspection.create({
      data: {
        ...rest,
        organizationId,
        inspectionNumber: this.generateNumber(),
        checkItems: checkItems?.length
          ? { create: checkItems.map((c: any, i: number) => ({ ...c, sortOrder: i })) }
          : undefined,
      },
      include: { _count: { select: { checkItems: true, defects: true } } },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    await this.findOne(organizationId, id);
    const { checkItems, ...rest } = data;
    return this.prisma.qualityInspection.update({
      where: { id },
      data: {
        ...rest,
        ...(checkItems !== undefined && {
          checkItems: {
            deleteMany: {},
            create: checkItems.map((c: any, i: number) => ({ ...c, sortOrder: i })),
          },
        }),
      },
    });
  }

  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.qualityInspection.delete({ where: { id } });
  }

  async addDefect(organizationId: string, inspectionId: string, data: any) {
    await this.findOne(organizationId, inspectionId);
    const defect = await this.prisma.defect.create({ data: { ...data, inspectionId } });
    await this.prisma.qualityInspection.update({
      where: { id: inspectionId },
      data: { failCount: { increment: data.quantity ?? 1 } },
    });
    return defect;
  }

  async resolveDefect(organizationId: string, inspectionId: string, defectId: string, resolution: string) {
    await this.findOne(organizationId, inspectionId);
    return this.prisma.defect.update({
      where: { id: defectId },
      data: { status: 'resolved', resolution, resolvedAt: new Date() },
    });
  }

  async updateCheckItem(organizationId: string, inspectionId: string, itemId: string, data: any) {
    await this.findOne(organizationId, inspectionId);
    const updated = await this.prisma.qualityCheckItem.update({ where: { id: itemId }, data });
    // Recalculate pass/fail counts
    const [passCount, failCount] = await Promise.all([
      this.prisma.qualityCheckItem.count({ where: { inspectionId, result: 'pass' } }),
      this.prisma.qualityCheckItem.count({ where: { inspectionId, result: 'fail' } }),
    ]);
    await this.prisma.qualityInspection.update({ where: { id: inspectionId }, data: { passCount, failCount } });
    return updated;
  }

  async getStats(organizationId: string) {
    const [total, byStatus, byType] = await Promise.all([
      this.prisma.qualityInspection.count({ where: { organizationId } }),
      this.prisma.qualityInspection.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.qualityInspection.groupBy({
        by: ['type'],
        where: { organizationId },
        _count: { _all: true },
      }),
    ]);

    const passed = byStatus.find((s) => s.status === 'passed')?._count._all ?? 0;
    const failed = byStatus.find((s) => s.status === 'failed')?._count._all ?? 0;
    const passRate = total > 0 ? Math.round(((passed / total) * 100) * 10) / 10 : 0;

    return {
      total,
      passed,
      failed,
      passRate,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count._all])),
    };
  }
}
