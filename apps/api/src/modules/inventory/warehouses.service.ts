import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: { organizationId, isActive: true },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { locations: true, stockEntries: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const w = await this.prisma.warehouse.findFirst({
      where: { id, organizationId },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        locations: { where: { isActive: true } },
        stockEntries: {
          include: { product: { select: { id: true, name: true, code: true, unit: true } } },
          orderBy: { quantity: 'desc' },
          take: 50,
        },
      },
    });
    if (!w) throw new NotFoundException('Depo bulunamadı');
    return w;
  }

  async create(organizationId: string, data: any) {
    return this.prisma.warehouse.create({ data: { ...data, organizationId } });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.warehouse.update({ where: { id }, data: { isActive: false } });
  }

  async getStats(organizationId: string) {
    const [total, byType] = await Promise.all([
      this.prisma.warehouse.count({ where: { organizationId, isActive: true } }),
      this.prisma.warehouse.groupBy({ by: ['type'], where: { organizationId, isActive: true }, _count: true }),
    ]);

    const totalStock = await this.prisma.warehouseStock.aggregate({
      where: { warehouse: { organizationId } },
      _sum: { quantity: true },
    });

    return { total, byType, totalStockItems: totalStock._sum.quantity ?? 0 };
  }

  async addLocation(warehouseId: string, organizationId: string, data: any) {
    await this.findOne(warehouseId, organizationId);
    return this.prisma.warehouseLocation.create({ data: { ...data, warehouseId } });
  }

  async updateStock(warehouseId: string, organizationId: string, productId: string, quantity: number) {
    await this.findOne(warehouseId, organizationId);
    return this.prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId, productId } },
      update: { quantity },
      create: { warehouseId, productId, quantity },
    });
  }
}
