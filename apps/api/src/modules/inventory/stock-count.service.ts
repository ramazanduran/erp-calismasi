import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../sequences/sequence.service';

@Injectable()
export class StockCountService {
  constructor(private prisma: PrismaService, private sequence: SequenceService) {}

  async findAll(organizationId: string) {
    return this.prisma.stockCount.findMany({
      where: { organizationId },
      include: { _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const count = await this.prisma.stockCount.findFirst({
      where: { id, organizationId },
      include: { lines: true },
    });
    if (!count) throw new NotFoundException('Stok sayımı bulunamadı');
    return count;
  }

  async create(organizationId: string, userId: string, notes?: string) {
    const countNumber = await this.sequence.next(organizationId, 'stock_count', 'SAY-');
    // Tüm aktif ürünleri otomatik ekle
    const products = await this.prisma.product.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, currentStock: true },
    });
    return this.prisma.stockCount.create({
      data: {
        organizationId,
        countNumber,
        notes,
        createdById: userId,
        lines: {
          create: products.map(p => ({
            productId: p.id,
            expectedQty: p.currentStock,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async updateLine(stockCountId: string, lineId: string, countedQty: number) {
    return this.prisma.stockCountLine.update({
      where: { id: lineId },
      data: { countedQty, difference: countedQty - (await this.prisma.stockCountLine.findUnique({ where: { id: lineId } }).then(l => Number(l!.expectedQty))) },
    });
  }

  async complete(id: string, organizationId: string) {
    const count = await this.findOne(id, organizationId);
    // Stokları güncelle
    for (const line of count.lines) {
      if (line.countedQty !== null) {
        await this.prisma.product.update({ where: { id: line.productId }, data: { currentStock: line.countedQty } });
      }
    }
    return this.prisma.stockCount.update({ where: { id }, data: { status: 'completed', completedAt: new Date() } });
  }
}
