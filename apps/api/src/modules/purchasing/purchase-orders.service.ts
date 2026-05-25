import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../sequences/sequence.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService, private sequence: SequenceService) {}

  async findAll(organizationId: string, params: { supplierId?: string; status?: string } = {}) {
    return this.prisma.purchaseOrder.findMany({
      where: { organizationId, supplierId: params.supplierId, status: params.status },
      include: { supplier: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: { supplier: true, items: true },
    });
    if (!order) throw new NotFoundException('Satın alma siparişi bulunamadı');
    return order;
  }

  async create(organizationId: string, userId: string, data: any) {
    const orderNumber = await this.sequence.next(organizationId, 'purchase_order', 'SAL-');
    const { items, ...orderData } = data;
    return this.prisma.purchaseOrder.create({
      data: {
        organizationId,
        orderNumber,
        createdById: userId,
        ...orderData,
        items: items ? { create: items } : undefined,
      },
      include: { items: true, supplier: true },
    });
  }

  async updateStatus(id: string, organizationId: string, status: string) {
    await this.findOne(id, organizationId);
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status } });
  }
}
