import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PriceListsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.priceList.findMany({
      where: { organizationId },
      include: { _count: { select: { items: true } } },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.priceList.findFirst({
      where: { id, organizationId },
      include: { items: true },
    });
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.priceList.create({ data: { organizationId, ...data } as any });
  }

  async addItem(priceListId: string, organizationId: string, data: { productId: string; price: number; discountRate?: number }) {
    return this.prisma.priceListItem.upsert({
      where: { priceListId_productId: { priceListId, productId: data.productId } },
      update: { price: data.price, discountRate: data.discountRate || 0 },
      create: { priceListId, ...data },
    });
  }

  async removeItem(itemId: string) {
    return this.prisma.priceListItem.delete({ where: { id: itemId } });
  }
}
