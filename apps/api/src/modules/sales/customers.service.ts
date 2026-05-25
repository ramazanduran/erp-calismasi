import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomersService {
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
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { code: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { phone: { contains: query.search, mode: 'insensitive' as const } },
          { taxNumber: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          name: true,
          email: true,
          phone: true,
          taxNumber: true,
          type: true,
          status: true,
          creditLimit: true,
          balance: true,
          createdAt: true,
        },
      }),
      this.prisma.customer.count({ where }),
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
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
    return customer;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.customer.create({
      data: {
        ...(data as Parameters<typeof this.prisma.customer.create>[0]['data']),
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.customer.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.customer.update>[0]['data'],
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.customer.delete({ where: { id } });
  }
}
