import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: { page?: number; limit?: number; search?: string; status?: string; type?: string },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.search && {
        OR: [
          { orderNumber: { contains: query.search, mode: 'insensitive' as const } },
          { customer: { name: { contains: query.search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, code: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    return order;
  }

  async create(organizationId: string, userId: string, data: Record<string, unknown>) {
    const { items, ...orderData } = data as { items?: Record<string, unknown>[]; [key: string]: unknown };

    return this.prisma.order.create({
      data: {
        ...(orderData as Parameters<typeof this.prisma.order.create>[0]['data']),
        organizationId,
        createdById: userId,
        ...(items && items.length > 0 && {
          items: {
            create: items as Parameters<typeof this.prisma.order.create>[0]['data'] extends { items?: { create?: infer T } } ? T : never,
          },
        }),
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.order.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.order.update>[0]['data'],
    });
  }

  async changeStatus(id: string, organizationId: string, newStatus: string) {
    const order = await this.findOne(id, organizationId);
    const allowed = VALID_STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `'${order.status}' durumundan '${newStatus}' durumuna geçiş yapılamaz`,
      );
    }

    const extraData: Record<string, unknown> = {};
    if (newStatus === 'shipped') extraData.shippedAt = new Date();
    if (newStatus === 'delivered') extraData.deliveredAt = new Date();

    return this.prisma.order.update({
      where: { id },
      data: { status: newStatus, ...extraData },
    });
  }

  async remove(id: string, organizationId: string) {
    const order = await this.findOne(id, organizationId);
    if (order.status !== 'draft') {
      throw new BadRequestException('Sadece taslak siparişler silinebilir');
    }
    return this.prisma.order.delete({ where: { id } });
  }
}
