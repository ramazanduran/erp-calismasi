import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.financialAccount.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { transactions: true } },
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const account = await this.prisma.financialAccount.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { transactions: true } },
      },
    });
    if (!account) throw new NotFoundException('Hesap bulunamadı');
    return account;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.financialAccount.create({
      data: {
        ...(data as Parameters<typeof this.prisma.financialAccount.create>[0]['data']),
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.financialAccount.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.financialAccount.update>[0]['data'],
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.financialAccount.delete({ where: { id } });
  }
}
