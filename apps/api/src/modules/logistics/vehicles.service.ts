import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: any = {}) {
    const { status, type, search } = query;
    const where: any = { organizationId, isActive: true };
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { driverName: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.vehicle.findMany({ where, orderBy: { plateNumber: 'asc' } });
  }

  async findOne(id: string, organizationId: string) {
    const v = await this.prisma.vehicle.findFirst({ where: { id, organizationId, isActive: true } });
    if (!v) throw new NotFoundException('Araç bulunamadı');
    return v;
  }

  async create(organizationId: string, data: any) {
    return this.prisma.vehicle.create({ data: { ...data, organizationId } });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    return this.prisma.vehicle.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.vehicle.update({ where: { id }, data: { isActive: false } });
  }

  async getStats(organizationId: string) {
    const [total, byStatus, byType] = await Promise.all([
      this.prisma.vehicle.count({ where: { organizationId, isActive: true } }),
      this.prisma.vehicle.groupBy({ by: ['status'], where: { organizationId, isActive: true }, _count: true }),
      this.prisma.vehicle.groupBy({ by: ['type'], where: { organizationId, isActive: true }, _count: true }),
    ]);
    return { total, byStatus, byType };
  }
}
