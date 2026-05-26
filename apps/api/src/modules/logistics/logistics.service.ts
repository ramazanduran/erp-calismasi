import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LogisticsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { status?: string; customerId?: string; orderId?: string }) {
    const where: Record<string, unknown> = { organizationId };
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;
    if (params.orderId) where.orderId = params.orderId;

    return this.prisma.shipment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } },
        events: { orderBy: { occurredAt: 'desc' }, take: 1 },
        _count: { select: { items: true, events: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, name: true, address: true, city: true, phone: true } },
        order: { select: { id: true, orderNumber: true } },
        items: true,
        events: { orderBy: { occurredAt: 'asc' } },
      },
    });
    if (!shipment) throw new NotFoundException('Sevkiyat bulunamadı');
    return shipment;
  }

  async findByTracking(trackingNumber: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        events: { orderBy: { occurredAt: 'asc' } },
        items: true,
      },
    });
    if (!shipment) throw new NotFoundException('Takip numarası bulunamadı');
    return shipment;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    const trackingNumber = data.trackingNumber as string || this.generateTrackingNumber();
    const { items, ...shipmentData } = data;

    return this.prisma.shipment.create({
      data: {
        organizationId,
        trackingNumber,
        ...shipmentData,
        items: Array.isArray(items)
          ? { create: items.map((item: Record<string, unknown>) => ({ ...item })) }
          : undefined,
        events: {
          create: [{
            status: 'pending',
            description: 'Sevkiyat oluşturuldu',
          }],
        },
      } as Parameters<typeof this.prisma.shipment.create>[0]['data'],
      include: { items: true, events: true },
    });
  }

  async updateStatus(id: string, organizationId: string, status: string, location?: string, description?: string) {
    await this.findOne(id, organizationId);

    const updateData: Record<string, unknown> = { status };
    if (status === 'delivered') updateData.actualDelivery = new Date();

    await this.prisma.shipment.update({
      where: { id },
      data: updateData as Parameters<typeof this.prisma.shipment.update>[0]['data'],
    });

    return this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status,
        location,
        description: description ?? this.getStatusDescription(status),
      },
    });
  }

  async getStats(organizationId: string) {
    const shipments = await this.prisma.shipment.findMany({ where: { organizationId } });
    const byStatus = shipments.reduce((acc: Record<string, number>, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    }, {});

    const totalCost = shipments.reduce((s, sh) => s + Number(sh.shippingCost), 0);
    const delivered = shipments.filter((s) => s.status === 'delivered');
    const avgDeliveryMs = delivered.length > 0
      ? delivered
          .filter((s) => s.actualDelivery && s.createdAt)
          .reduce((sum, s) => sum + (s.actualDelivery!.getTime() - s.createdAt.getTime()), 0) / (delivered.length || 1)
      : 0;

    return {
      total: shipments.length,
      byStatus,
      totalCost,
      avgDeliveryDays: avgDeliveryMs / (1000 * 60 * 60 * 24),
      inTransit: shipments.filter((s) => s.status === 'in_transit').length,
      pending: shipments.filter((s) => s.status === 'pending').length,
    };
  }

  private generateTrackingNumber() {
    return 'ERP-' + uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  }

  private getStatusDescription(status: string): string {
    const map: Record<string, string> = {
      pending: 'Sevkiyat beklemede',
      picked_up: 'Kargoya teslim edildi',
      in_transit: 'Taşıma sürecinde',
      out_for_delivery: 'Dağıtımda',
      delivered: 'Teslim edildi',
      returned: 'İade edildi',
      failed: 'Teslim başarısız',
    };
    return map[status] ?? status;
  }
}
