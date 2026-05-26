import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BankReconciliationService {
  constructor(private prisma: PrismaService) {}

  async findStatements(organizationId: string, accountId?: string) {
    const where: any = { organizationId };
    if (accountId) where.accountId = accountId;
    return this.prisma.bankStatement.findMany({
      where,
      include: {
        account: { select: { id: true, name: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { endDate: 'desc' },
    });
  }

  async findStatement(organizationId: string, id: string) {
    const stmt = await this.prisma.bankStatement.findFirst({
      where: { id, organizationId },
      include: {
        account: { select: { id: true, name: true, currency: true } },
        lines: {
          include: { transaction: { select: { id: true, description: true, amount: true, date: true } } },
          orderBy: { date: 'asc' },
        },
      },
    });
    if (!stmt) throw new NotFoundException('Banka özeti bulunamadı');
    return stmt;
  }

  async createStatement(organizationId: string, data: any) {
    const { lines, ...rest } = data;
    return this.prisma.bankStatement.create({
      data: {
        ...rest,
        organizationId,
        lines: lines?.length ? { create: lines } : undefined,
      },
      include: { _count: { select: { lines: true } } },
    });
  }

  async matchLine(organizationId: string, statementId: string, lineId: string, transactionId: string) {
    await this.findStatement(organizationId, statementId);
    return this.prisma.bankStatementLine.update({
      where: { id: lineId },
      data: { transactionId, status: 'matched', matchedAt: new Date() },
    });
  }

  async ignoreLine(organizationId: string, statementId: string, lineId: string, notes?: string) {
    await this.findStatement(organizationId, statementId);
    return this.prisma.bankStatementLine.update({
      where: { id: lineId },
      data: { status: 'ignored', notes: notes || 'Kullanıcı tarafından görmezden gelindi', matchedAt: new Date() },
    });
  }

  async autoMatch(organizationId: string, statementId: string) {
    const stmt = await this.findStatement(organizationId, statementId);
    const unmatchedLines = (stmt as any).lines.filter((l: any) => l.status === 'unmatched');

    let matched = 0;
    for (const line of unmatchedLines) {
      const lineDate = new Date(line.date);
      const startRange = new Date(lineDate);
      startRange.setDate(startRange.getDate() - 3);
      const endRange = new Date(lineDate);
      endRange.setDate(endRange.getDate() + 3);

      const tx = await this.prisma.transaction.findFirst({
        where: {
          account: { organizationId },
          accountId: stmt.accountId,
          amount: line.type === 'credit' ? { gte: 0 } : { lte: 0 },
          date: { gte: startRange, lte: endRange },
        },
      });

      if (tx && Math.abs(Number(tx.amount)) === Math.abs(Number(line.amount))) {
        await this.prisma.bankStatementLine.update({
          where: { id: line.id },
          data: { transactionId: tx.id, status: 'matched', matchedAt: new Date() },
        });
        matched++;
      }
    }

    // Update statement status
    const remaining = await this.prisma.bankStatementLine.count({
      where: { statementId, status: 'unmatched' },
    });
    if (remaining === 0) {
      await this.prisma.bankStatement.update({ where: { id: statementId }, data: { status: 'reconciled' } });
    }

    return { matched, remaining };
  }

  async getSummary(organizationId: string, statementId: string) {
    const [total, matched, ignored, unmatched] = await Promise.all([
      this.prisma.bankStatementLine.count({ where: { statementId } }),
      this.prisma.bankStatementLine.count({ where: { statementId, status: 'matched' } }),
      this.prisma.bankStatementLine.count({ where: { statementId, status: 'ignored' } }),
      this.prisma.bankStatementLine.count({ where: { statementId, status: 'unmatched' } }),
    ]);
    const progress = total > 0 ? Math.round(((matched + ignored) / total) * 100) : 0;
    return { total, matched, ignored, unmatched, progress };
  }
}
