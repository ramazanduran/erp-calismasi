import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalCustomers,
      activeOrders,
      pendingInvoices,
      totalProducts,
      thisMonthRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { organizationId, isActive: true } }),
      this.prisma.order.count({
        where: { organizationId, status: { in: ['confirmed', 'processing', 'shipped'] } },
      }),
      this.prisma.invoice.count({
        where: { organizationId, status: { in: ['draft', 'sent', 'overdue'] } },
      }),
      this.prisma.product.count({ where: { organizationId, isActive: true } }),
      this.prisma.invoice.aggregate({
        where: {
          organizationId,
          status: 'paid',
          paidAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          organizationId,
          status: 'paid',
          paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const thisMonth = Number(thisMonthRevenue._sum.totalAmount ?? 0);
    const lastMonth = Number(lastMonthRevenue._sum.totalAmount ?? 0);
    const revenueChange =
      lastMonth === 0 ? 100 : ((thisMonth - lastMonth) / lastMonth) * 100;

    return {
      totalCustomers,
      activeOrders,
      pendingInvoices,
      totalProducts,
      thisMonthRevenue: thisMonth,
      lastMonthRevenue: lastMonth,
      revenueChange: Math.round(revenueChange * 10) / 10,
    };
  }

  async getSalesAnalytics(organizationId: string, period = '6months') {
    const months = period === '3months' ? 3 : period === '12months' ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const [orders, topCustomers, statusDistribution] = await Promise.all([
      this.prisma.order.findMany({
        where: { organizationId, createdAt: { gte: startDate } },
        select: { totalAmount: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { organizationId, status: { not: 'cancelled' } },
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { id: true },
      }),
    ]);

    // Group by month
    const monthlyMap: Record<string, { month: string; amount: number; count: number }> = {};
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (!monthlyMap[key]) monthlyMap[key] = { month: label, amount: 0, count: 0 };
      monthlyMap[key].amount += Number(order.totalAmount ?? 0);
      monthlyMap[key].count += 1;
    }
    const monthlySales = Object.values(monthlyMap);

    // Enrich top customers
    const customerIds = topCustomers.map((c) => c.customerId).filter(Boolean) as string[];
    const customerDetails = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, code: true },
    });
    const customerMap = Object.fromEntries(customerDetails.map((c) => [c.id, c]));

    const topCustomersWithName = topCustomers.map((tc) => ({
      customerId: tc.customerId,
      customerName: tc.customerId ? customerMap[tc.customerId]?.name ?? 'Bilinmiyor' : 'Bilinmiyor',
      customerCode: tc.customerId ? customerMap[tc.customerId]?.code ?? '' : '',
      totalAmount: Number(tc._sum.totalAmount ?? 0),
      orderCount: tc._count.id,
    }));

    const orderStatusDist = statusDistribution.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    return { monthlySales, topCustomers: topCustomersWithName, orderStatusDistribution: orderStatusDist };
  }

  async getInventoryAnalytics(organizationId: string) {
    const [totalProducts, lowStockProducts, categoryDistribution] = await Promise.all([
      this.prisma.product.count({ where: { organizationId, isActive: true } }),
      this.prisma.product.findMany({
        where: {
          organizationId,
          isActive: true,
          AND: [
            { minStock: { gt: 0 } },
            // currentStock < minStock — use raw or filter in app
          ],
        },
        select: { id: true, name: true, code: true, currentStock: true, minStock: true, unit: true },
        orderBy: { currentStock: 'asc' },
        take: 20,
      }),
      this.prisma.product.groupBy({
        by: ['categoryId'],
        where: { organizationId, isActive: true },
        _count: { id: true },
      }),
    ]);

    // Filter products where currentStock < minStock in memory
    const filteredLowStock = lowStockProducts.filter(
      (p) => p.minStock !== null && Number(p.currentStock) < Number(p.minStock),
    );

    // Enrich category names
    const categoryIds = categoryDistribution.map((c) => c.categoryId).filter(Boolean) as string[];
    const categories = await this.prisma.productCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    const categoryDist = categoryDistribution.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryId ? categoryMap[c.categoryId] ?? 'Kategorisiz' : 'Kategorisiz',
      productCount: c._count.id,
    }));

    return {
      totalProducts,
      lowStockCount: filteredLowStock.length,
      lowStockProducts: filteredLowStock,
      categoryDistribution: categoryDist,
    };
  }

  async getFinanceAnalytics(organizationId: string, period = '6months') {
    const months = period === '3months' ? 3 : period === '12months' ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const [transactions, unpaidInvoices, totalPaid] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { organizationId, date: { gte: startDate } },
        select: { type: true, amount: true, date: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.invoice.aggregate({
        where: { organizationId, status: { in: ['sent', 'overdue'] } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.invoice.aggregate({
        where: { organizationId, status: 'paid', paidAt: { gte: startDate } },
        _sum: { totalAmount: true },
      }),
    ]);

    // Group income/expense by month
    const monthlyMap: Record<string, { month: string; income: number; expense: number }> = {};
    for (const tx of transactions) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (!monthlyMap[key]) monthlyMap[key] = { month: label, income: 0, expense: 0 };
      const amount = Number(tx.amount ?? 0);
      if (tx.type === 'income') monthlyMap[key].income += amount;
      else if (tx.type === 'expense') monthlyMap[key].expense += amount;
    }
    const monthlyTrend = Object.values(monthlyMap);

    const totalUnpaid = Number(unpaidInvoices._sum.totalAmount ?? 0);
    const totalPaidAmount = Number(totalPaid._sum.totalAmount ?? 0);
    const collectionRate =
      totalUnpaid + totalPaidAmount === 0
        ? 0
        : Math.round((totalPaidAmount / (totalUnpaid + totalPaidAmount)) * 1000) / 10;

    return {
      monthlyTrend,
      unpaidInvoiceAmount: totalUnpaid,
      unpaidInvoiceCount: unpaidInvoices._count.id,
      collectionRate,
    };
  }

  async getHRAnalytics(organizationId: string) {
    const [totalEmployees, activeEmployees, pendingLeaves, departmentDistribution] =
      await Promise.all([
        this.prisma.employee.count({ where: { organizationId } }),
        this.prisma.employee.count({ where: { organizationId, status: 'active' } }),
        this.prisma.leaveRequest.count({
          where: { organizationId, status: 'pending' },
        }),
        this.prisma.employee.groupBy({
          by: ['department'],
          where: { organizationId, status: 'active' },
          _count: { id: true },
        }),
      ]);

    const deptDist = departmentDistribution
      .filter((d) => d.department)
      .map((d) => ({
        department: d.department as string,
        count: d._count.id,
      }));

    return { totalEmployees, activeEmployees, pendingLeaves, departmentDistribution: deptDist };
  }
}
