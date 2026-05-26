import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith';

interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

const DATA_SOURCES: Record<string, { label: string; fields: Array<{ key: string; label: string; type: string }> }> = {
  orders: {
    label: 'Siparişler',
    fields: [
      { key: 'orderNumber', label: 'Sipariş No', type: 'text' },
      { key: 'status', label: 'Durum', type: 'text' },
      { key: 'totalAmount', label: 'Toplam Tutar', type: 'number' },
      { key: 'createdAt', label: 'Oluşturma Tarihi', type: 'date' },
    ],
  },
  invoices: {
    label: 'Faturalar',
    fields: [
      { key: 'invoiceNumber', label: 'Fatura No', type: 'text' },
      { key: 'status', label: 'Durum', type: 'text' },
      { key: 'totalAmount', label: 'Toplam Tutar', type: 'number' },
      { key: 'dueDate', label: 'Vade Tarihi', type: 'date' },
      { key: 'paidAt', label: 'Ödeme Tarihi', type: 'date' },
    ],
  },
  customers: {
    label: 'Müşteriler',
    fields: [
      { key: 'name', label: 'Ad', type: 'text' },
      { key: 'email', label: 'E-posta', type: 'text' },
      { key: 'city', label: 'Şehir', type: 'text' },
      { key: 'balance', label: 'Bakiye', type: 'number' },
      { key: 'createdAt', label: 'Kayıt Tarihi', type: 'date' },
    ],
  },
  products: {
    label: 'Ürünler',
    fields: [
      { key: 'code', label: 'Kod', type: 'text' },
      { key: 'name', label: 'Ad', type: 'text' },
      { key: 'currentStock', label: 'Stok', type: 'number' },
      { key: 'salePrice', label: 'Satış Fiyatı', type: 'number' },
      { key: 'costPrice', label: 'Maliyet', type: 'number' },
    ],
  },
  employees: {
    label: 'Personeller',
    fields: [
      { key: 'firstName', label: 'Ad', type: 'text' },
      { key: 'lastName', label: 'Soyad', type: 'text' },
      { key: 'department', label: 'Departman', type: 'text' },
      { key: 'salary', label: 'Maaş', type: 'number' },
      { key: 'hireDate', label: 'İşe Başlama', type: 'date' },
    ],
  },
};

@Injectable()
export class CustomReportsService {
  constructor(private prisma: PrismaService) {}

  getDataSources() {
    return Object.entries(DATA_SOURCES).map(([key, v]) => ({ key, ...v }));
  }

  async findAll(organizationId: string) {
    return this.prisma.savedReport.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const report = await this.prisma.savedReport.findFirst({
      where: { id, organizationId },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    return report;
  }

  async save(organizationId: string, userId: string, data: Record<string, unknown>) {
    return this.prisma.savedReport.create({
      data: {
        organizationId,
        createdById: userId,
        ...data,
      } as Parameters<typeof this.prisma.savedReport.create>[0]['data'],
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.savedReport.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.savedReport.update>[0]['data'],
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.savedReport.delete({ where: { id } });
  }

  async run(config: {
    organizationId: string;
    dataSource: string;
    columns: string[];
    filters: ReportFilter[];
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    limit?: number;
  }) {
    const { organizationId, dataSource, filters, sortBy, sortDir, limit } = config;

    const where = this.buildWhereClause(organizationId, dataSource, filters);
    const orderBy = sortBy ? { [sortBy]: sortDir ?? 'desc' } : { createdAt: 'desc' as const };

    const data = await this.queryDataSource(dataSource, where, orderBy, limit ?? 1000);
    return { data, total: data.length, dataSource };
  }

  private buildWhereClause(
    organizationId: string,
    _dataSource: string,
    filters: ReportFilter[],
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { organizationId };
    for (const f of filters) {
      const prismaOp = this.operatorToPrisma(f.operator);
      where[f.field] = prismaOp ? { [prismaOp]: f.value } : f.value;
    }
    return where;
  }

  private operatorToPrisma(op: FilterOperator): string | null {
    const map: Record<FilterOperator, string | null> = {
      eq: null, neq: 'not', gt: 'gt', gte: 'gte', lt: 'lt', lte: 'lte',
      contains: 'contains', startsWith: 'startsWith',
    };
    return map[op];
  }

  private async queryDataSource(
    dataSource: string,
    where: Record<string, unknown>,
    orderBy: Record<string, string>,
    take: number,
  ) {
    switch (dataSource) {
      case 'orders':
        return this.prisma.order.findMany({
          where, orderBy, take,
          include: { customer: { select: { name: true } } },
        });
      case 'invoices':
        return this.prisma.invoice.findMany({ where, orderBy, take });
      case 'customers':
        return this.prisma.customer.findMany({ where, orderBy, take });
      case 'products':
        return this.prisma.product.findMany({ where, orderBy, take });
      case 'employees':
        return this.prisma.employee.findMany({ where, orderBy, take });
      default:
        return [];
    }
  }
}
