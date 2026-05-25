import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ChartOfAccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.chartOfAccount.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
      include: { children: { orderBy: { code: 'asc' } } },
    });
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.chartOfAccount.create({ data: { organizationId, ...data } as any });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    return this.prisma.chartOfAccount.updateMany({ where: { id, organizationId }, data: data as any });
  }

  async getAccountBalance(id: string, organizationId: string) {
    const lines = await this.prisma.journalLine.findMany({
      where: { accountId: id, journalEntry: { organizationId, isPosted: true } },
    });
    const debit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const credit = lines.reduce((sum, l) => sum + Number(l.credit), 0);
    return { debit, credit, balance: debit - credit };
  }
}
