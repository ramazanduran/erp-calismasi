import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InvoicesService {
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
          { invoiceNumber: { contains: query.search, mode: 'insensitive' as const } },
          { customer: { name: { contains: query.search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
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
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, code: true, name: true, email: true } },
        order: { select: { id: true, orderNumber: true } },
        items: {
          include: {
            product: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Fatura bulunamadı');
    return invoice;
  }

  async create(organizationId: string, userId: string, data: Record<string, unknown>) {
    const { items, ...invoiceData } = data as { items?: Record<string, unknown>[]; [key: string]: unknown };

    return this.prisma.invoice.create({
      data: {
        ...(invoiceData as Parameters<typeof this.prisma.invoice.create>[0]['data']),
        organizationId,
        createdById: userId,
        ...(items && items.length > 0 && {
          items: {
            create: items as Parameters<typeof this.prisma.invoice.create>[0]['data'] extends { items?: { create?: infer T } } ? T : never,
          },
        }),
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.invoice.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.invoice.update>[0]['data'],
    });
  }

  async send(id: string, organizationId: string) {
    const invoice = await this.findOne(id, organizationId);
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Sadece taslak faturalar gönderilebilir');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'sent' },
    });
  }

  async markAsPaid(id: string, organizationId: string) {
    const invoice = await this.findOne(id, organizationId);
    if (!['sent', 'overdue'].includes(invoice.status)) {
      throw new BadRequestException('Sadece gönderilmiş veya vadesi geçmiş faturalar ödendi olarak işaretlenebilir');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
    });
  }

  async remove(id: string, organizationId: string) {
    const invoice = await this.findOne(id, organizationId);
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Sadece taslak faturalar silinebilir');
    }
    return this.prisma.invoice.delete({ where: { id } });
  }
}
