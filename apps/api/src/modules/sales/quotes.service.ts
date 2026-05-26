import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: any = {}) {
    const { status, customerId, search, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = { organizationId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.salesQuote.findMany({
        where, skip, take: +limit,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          items: {
            include: { product: { select: { id: true, name: true, code: true } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.salesQuote.count({ where }),
    ]);
    return { data, total, page: +page, limit: +limit };
  }

  async findOne(id: string, organizationId: string) {
    const quote = await this.prisma.salesQuote.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: {
          include: { product: { select: { id: true, name: true, code: true, unit: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!quote) throw new NotFoundException('Teklif bulunamadı');
    return quote;
  }

  async create(organizationId: string, userId: string, data: any) {
    const { items = [], ...quoteData } = data;
    const number = await this.generateNumber(organizationId);
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
    }, 0);
    const taxAmount = items.reduce((sum: number, item: any) => {
      const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      return sum + lineTotal * ((item.vatRate || 18) / 100);
    }, 0);

    return this.prisma.salesQuote.create({
      data: {
        ...quoteData,
        organizationId,
        createdById: userId,
        quoteNumber: number,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        items: {
          create: items.map((item: any, idx: number) => {
            const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
            const vat = lineTotal * ((item.vatRate || 18) / 100);
            return { ...item, totalAmount: lineTotal + vat, sortOrder: idx };
          }),
        },
      },
      include: { customer: { select: { id: true, name: true } }, items: true },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    const { items, ...quoteData } = data;
    if (items) {
      await this.prisma.salesQuoteItem.deleteMany({ where: { quoteId: id } });
      const subtotal = items.reduce((sum: number, item: any) => {
        return sum + item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      }, 0);
      const taxAmount = items.reduce((sum: number, item: any) => {
        const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        return sum + lineTotal * ((item.vatRate || 18) / 100);
      }, 0);
      return this.prisma.salesQuote.update({
        where: { id },
        data: {
          ...quoteData, subtotal, taxAmount, totalAmount: subtotal + taxAmount,
          items: {
            create: items.map((item: any, idx: number) => {
              const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
              const vat = lineTotal * ((item.vatRate || 18) / 100);
              return { ...item, totalAmount: lineTotal + vat, sortOrder: idx };
            }),
          },
        },
        include: { items: true },
      });
    }
    return this.prisma.salesQuote.update({ where: { id }, data: quoteData });
  }

  async updateStatus(id: string, organizationId: string, status: string) {
    await this.findOne(id, organizationId);
    return this.prisma.salesQuote.update({ where: { id }, data: { status } });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.salesQuote.delete({ where: { id } });
  }

  async getStats(organizationId: string) {
    const [total, byStatus] = await Promise.all([
      this.prisma.salesQuote.count({ where: { organizationId } }),
      this.prisma.salesQuote.groupBy({
        by: ['status'], where: { organizationId }, _count: true, _sum: { totalAmount: true },
      }),
    ]);
    return { total, byStatus };
  }

  private async generateNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.salesQuote.count({ where: { organizationId } });
    return `TEK-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
