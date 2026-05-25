import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: { page?: number; limit?: number; accountId?: string; type?: string },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(query.accountId && { accountId: query.accountId }),
      ...(query.type && { type: query.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          account: { select: { id: true, name: true, type: true, currency: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
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
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, organizationId },
      include: {
        account: { select: { id: true, name: true, type: true, currency: true } },
      },
    });
    if (!transaction) throw new NotFoundException('İşlem bulunamadı');
    return transaction;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.transaction.create({
      data: {
        ...(data as Parameters<typeof this.prisma.transaction.create>[0]['data']),
        organizationId,
      },
      include: {
        account: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.transaction.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.transaction.update>[0]['data'],
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.transaction.delete({ where: { id } });
  }
}
