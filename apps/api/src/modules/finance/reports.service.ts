import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getProfitLoss(organizationId: string, year: number) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);

    const invoices = await this.prisma.invoice.findMany({
      where: { organizationId, status: { in: ['paid', 'partially_paid'] }, dueDate: { gte: startDate, lte: endDate } },
      select: { subtotal: true, taxAmount: true, totalAmount: true, dueDate: true, type: true },
    });

    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: { organizationId, status: 'received', createdAt: { gte: startDate, lte: endDate } },
      select: { totalAmount: true, createdAt: true },
    });

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const rev = invoices
        .filter((inv) => inv.type === 'sale' && new Date(inv.dueDate!).getMonth() + 1 === month)
        .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      const cogs = purchaseOrders
        .filter((po) => new Date(po.createdAt).getMonth() + 1 === month)
        .reduce((sum, po) => sum + Number(po.totalAmount), 0);
      return { month, revenue: rev, cogs, grossProfit: rev - cogs };
    });

    const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
    const totalCogs = monthlyRevenue.reduce((s, m) => s + m.cogs, 0);

    return {
      year,
      totalRevenue,
      totalCogs,
      grossProfit: totalRevenue - totalCogs,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0,
      monthly: monthlyRevenue,
    };
  }

  async getCashFlow(organizationId: string, year: number) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);

    const transactions = await this.prisma.transaction.findMany({
      where: { organizationId, date: { gte: startDate, lte: endDate } },
      select: { amount: true, type: true, date: true, description: true },
      orderBy: { date: 'asc' },
    });

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const txs = transactions.filter((t) => new Date(t.date).getMonth() + 1 === month);
      const inflow = txs.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
      const outflow = txs.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
      return { month, inflow, outflow, net: inflow - outflow };
    });

    let runningBalance = 0;
    const withBalance = monthly.map((m) => {
      runningBalance += m.net;
      return { ...m, balance: runningBalance };
    });

    return { year, monthly: withBalance, totalInflow: monthly.reduce((s, m) => s + m.inflow, 0), totalOutflow: monthly.reduce((s, m) => s + m.outflow, 0) };
  }

  async getBalanceSheet(organizationId: string) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: { organizationId },
      select: { id: true, name: true, type: true, balance: true, currency: true },
    });

    const byType = accounts.reduce((acc, a) => {
      if (!acc[a.type]) acc[a.type] = { accounts: [], total: 0 };
      acc[a.type].accounts.push(a);
      acc[a.type].total += Number(a.balance);
      return acc;
    }, {} as Record<string, any>);

    return {
      assets: byType['asset'] || { accounts: [], total: 0 },
      liabilities: byType['liability'] || { accounts: [], total: 0 },
      equity: byType['equity'] || { accounts: [], total: 0 },
      totalAssets: (byType['asset']?.total || 0),
      totalLiabilities: (byType['liability']?.total || 0),
      totalEquity: (byType['equity']?.total || 0),
    };
  }

  async getAccountsReceivable(organizationId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { organizationId, status: { in: ['sent', 'partially_paid', 'overdue'] }, type: 'sale' },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const aged = invoices.map((inv) => {
      const daysOverdue = inv.dueDate ? Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000) : 0;
      return { ...inv, daysOverdue };
    });

    return {
      total: aged.reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0),
      current: aged.filter((i) => i.daysOverdue <= 0).reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0),
      overdue30: aged.filter((i) => i.daysOverdue > 0 && i.daysOverdue <= 30).reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0),
      overdue60: aged.filter((i) => i.daysOverdue > 30 && i.daysOverdue <= 60).reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0),
      overdue90plus: aged.filter((i) => i.daysOverdue > 60).reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0),
      invoices: aged,
    };
  }
}
