import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { search?: string; status?: string } = {}) {
    const { search, status } = params;
    return this.prisma.supplier.findMany({
      where: {
        organizationId,
        status: status || undefined,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ] : undefined,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const s = await this.prisma.supplier.findFirst({ where: { id, organizationId } });
    if (!s) throw new NotFoundException('Tedarikçi bulunamadı');
    return s;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.supplier.create({ data: { organizationId, ...data } as any });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.supplier.update({ where: { id }, data: data as any });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.supplier.delete({ where: { id } });
  }
}
