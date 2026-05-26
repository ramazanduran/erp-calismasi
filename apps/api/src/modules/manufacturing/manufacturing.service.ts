import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ManufacturingService {
  constructor(private prisma: PrismaService) {}

  private generatePONumber(organizationId: string) {
    const ts = Date.now().toString(36).toUpperCase();
    return `PO-${ts}`;
  }

  // ─── Work Centers ─────────────────────────────────────────────────────────

  async findWorkCenters(organizationId: string) {
    return this.prisma.workCenter.findMany({
      where: { organizationId },
      include: { _count: { select: { operations: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createWorkCenter(organizationId: string, data: any) {
    return this.prisma.workCenter.create({ data: { ...data, organizationId } });
  }

  async updateWorkCenter(organizationId: string, id: string, data: any) {
    const wc = await this.prisma.workCenter.findFirst({ where: { id, organizationId } });
    if (!wc) throw new NotFoundException('İş merkezi bulunamadı');
    return this.prisma.workCenter.update({ where: { id }, data });
  }

  // ─── Bills of Material ─────────────────────────────────────────────────────

  async findBOMs(organizationId: string, params: { productId?: string; status?: string }) {
    const where: any = { organizationId };
    if (params.productId) where.productId = params.productId;
    if (params.status) where.status = params.status;
    return this.prisma.billOfMaterial.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true, productionOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBOM(organizationId: string, id: string) {
    const bom = await this.prisma.billOfMaterial.findFirst({
      where: { id, organizationId },
      include: {
        product: { select: { id: true, name: true, code: true, unit: true } },
        items: {
          include: { component: { select: { id: true, name: true, code: true, unit: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!bom) throw new NotFoundException('Ürün reçetesi bulunamadı');
    return bom;
  }

  async createBOM(organizationId: string, data: any) {
    const { items, ...rest } = data;
    return this.prisma.billOfMaterial.create({
      data: {
        ...rest,
        organizationId,
        items: items?.length
          ? { create: items.map((item: any, i: number) => ({ ...item, sortOrder: i })) }
          : undefined,
      },
      include: {
        product: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async updateBOM(organizationId: string, id: string, data: any) {
    await this.findBOM(organizationId, id);
    const { items, ...rest } = data;
    return this.prisma.billOfMaterial.update({
      where: { id },
      data: {
        ...rest,
        ...(items !== undefined && {
          items: {
            deleteMany: {},
            create: items.map((item: any, i: number) => ({ ...item, sortOrder: i })),
          },
        }),
      },
    });
  }

  async deleteBOM(organizationId: string, id: string) {
    await this.findBOM(organizationId, id);
    await this.prisma.billOfMaterial.delete({ where: { id } });
  }

  // ─── Production Orders ─────────────────────────────────────────────────────

  async findOrders(organizationId: string, params: { status?: string; limit?: number; offset?: number }) {
    const where: any = { organizationId };
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, code: true } },
          bom: { select: { id: true, version: true } },
          _count: { select: { operations: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.productionOrder.count({ where }),
    ]);
    return { items, total };
  }

  async findOrder(organizationId: string, id: string) {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, organizationId },
      include: {
        product: { select: { id: true, name: true, code: true, unit: true } },
        bom: {
          include: {
            items: { include: { component: { select: { id: true, name: true, code: true, unit: true } } } },
          },
        },
        operations: {
          include: { workCenter: { select: { id: true, name: true, code: true } } },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    if (!order) throw new NotFoundException('Üretim emri bulunamadı');
    return order;
  }

  async createOrder(organizationId: string, userId: string, data: any) {
    const { operations, ...rest } = data;
    return this.prisma.productionOrder.create({
      data: {
        ...rest,
        organizationId,
        createdById: userId,
        orderNumber: this.generatePONumber(organizationId),
        operations: operations?.length
          ? { create: operations }
          : undefined,
      },
    });
  }

  async updateOrder(organizationId: string, id: string, data: any) {
    await this.findOrder(organizationId, id);
    const current = await this.prisma.productionOrder.findUnique({ where: { id } });
    const updateData: any = { ...data };
    if (data.status === 'in_progress' && !current?.actualStart) updateData.actualStart = new Date();
    if (data.status === 'completed' && !current?.actualEnd) updateData.actualEnd = new Date();
    return this.prisma.productionOrder.update({ where: { id }, data: updateData });
  }

  async recordProduction(organizationId: string, id: string, producedQty: number, scrapQty = 0) {
    const order = await this.findOrder(organizationId, id);
    const newProduced = Number(order.producedQty) + producedQty;
    const status = newProduced >= Number(order.quantity) ? 'completed' : 'in_progress';
    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        producedQty: { increment: producedQty },
        scrapQty: { increment: scrapQty },
        status,
        ...(status === 'completed' ? { actualEnd: new Date() } : {}),
      },
    });
  }

  async updateOperation(organizationId: string, orderId: string, opId: string, data: any) {
    await this.findOrder(organizationId, orderId);
    const updateData: any = { ...data };
    if (data.status === 'in_progress' && !updateData.startedAt) updateData.startedAt = new Date();
    if (data.status === 'completed' && !updateData.completedAt) updateData.completedAt = new Date();
    return this.prisma.workOperation.update({ where: { id: opId }, data: updateData });
  }

  async getStats(organizationId: string) {
    const [total, byStatus, totalProduced] = await Promise.all([
      this.prisma.productionOrder.count({ where: { organizationId } }),
      this.prisma.productionOrder.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.productionOrder.aggregate({
        where: { organizationId },
        _sum: { producedQty: true, quantity: true, scrapQty: true },
      }),
    ]);

    const scrapRate = totalProduced._sum.quantity && Number(totalProduced._sum.quantity) > 0
      ? Math.round((Number(totalProduced._sum.scrapQty ?? 0) / Number(totalProduced._sum.quantity)) * 1000) / 10
      : 0;

    return {
      total,
      inProgress: byStatus.find((s) => s.status === 'in_progress')?._count._all ?? 0,
      completed: byStatus.find((s) => s.status === 'completed')?._count._all ?? 0,
      totalProduced: totalProduced._sum.producedQty ?? 0,
      scrapRate,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    };
  }
}
