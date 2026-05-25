import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../sequences/sequence.service';

@Injectable()
export class JournalEntriesService {
  constructor(private prisma: PrismaService, private sequence: SequenceService) {}

  async findAll(organizationId: string, params: { startDate?: string; endDate?: string; isPosted?: boolean } = {}) {
    return this.prisma.journalEntry.findMany({
      where: {
        organizationId,
        isPosted: params.isPosted,
        date: {
          gte: params.startDate ? new Date(params.startDate) : undefined,
          lte: params.endDate ? new Date(params.endDate) : undefined,
        },
      },
      include: { lines: { include: { account: { select: { code: true, name: true } } } } },
      orderBy: { date: 'desc' },
    });
  }

  async create(organizationId: string, userId: string, data: any) {
    const { lines, ...entryData } = data;
    // Validate debit = credit
    const totalDebit = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('Borç ve alacak toplamları eşit olmalıdır');
    }
    const entryNumber = await this.sequence.next(organizationId, 'journal_entry', 'MUH-');
    return this.prisma.journalEntry.create({
      data: {
        organizationId,
        entryNumber,
        createdById: userId,
        ...entryData,
        lines: { create: lines },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  async post(id: string, organizationId: string) {
    return this.prisma.journalEntry.updateMany({
      where: { id, organizationId },
      data: { isPosted: true },
    });
  }

  async getTrialBalance(organizationId: string) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, isActive: true },
      include: {
        journalLines: {
          where: { journalEntry: { isPosted: true } },
        },
      },
      orderBy: { code: 'asc' },
    });
    return accounts.map(acc => ({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      debit: acc.journalLines.reduce((s, l) => s + Number(l.debit), 0),
      credit: acc.journalLines.reduce((s, l) => s + Number(l.credit), 0),
    }));
  }
}
