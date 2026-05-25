import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MovementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: { page?: number; limit?: number; productId?: string; type?: string },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(query.productId && { productId: query.productId }),
      ...(query.type && { type: query.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, code: true, name: true, unit: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
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
    const movement = await this.prisma.stockMovement.findFirst({
      where: { id, organizationId },
      include: {
        product: { select: { id: true, code: true, name: true, unit: true } },
      },
    });
    if (!movement) throw new NotFoundException('Stok hareketi bulunamadı');
    return movement;
  }

  async createMovement(
    organizationId: string,
    userId: string,
    data: {
      productId: string;
      type: 'in' | 'out' | 'adjustment' | 'transfer';
      quantity: number;
      unitCost?: number;
      reference?: string;
      notes?: string;
    },
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: data.productId, organizationId },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    // Calculate stock delta
    let stockDelta = 0;
    if (data.type === 'in') stockDelta = data.quantity;
    else if (data.type === 'out') stockDelta = -data.quantity;
    else if (data.type === 'adjustment') stockDelta = data.quantity; // can be negative

    // Run in transaction: create movement + update product stock
    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          organizationId,
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          unitCost: data.unitCost,
          reference: data.reference,
          notes: data.notes,
          createdById: userId,
        },
        include: {
          product: { select: { id: true, code: true, name: true, unit: true } },
        },
      });

      if (stockDelta !== 0) {
        await tx.product.update({
          where: { id: data.productId },
          data: {
            currentStock: {
              increment: stockDelta,
            },
          },
        });
      }

      return movement;
    });
  }
}
