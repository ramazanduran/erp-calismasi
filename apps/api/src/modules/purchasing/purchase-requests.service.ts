import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PurchaseRequestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: any = {}) {
    const { status, departmentId, search, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = { organizationId };
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where, skip, take: +limit,
        include: {
          requestedBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, code: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);
    return { data, total, page: +page, limit: +limit };
  }

  async findOne(id: string, organizationId: string) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id, organizationId },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        department: true,
        items: {
          include: { product: { select: { id: true, name: true, code: true, unit: true, purchasePrice: true } } },
        },
      },
    });
    if (!pr) throw new NotFoundException('Satın alma talebi bulunamadı');
    return pr;
  }

  async create(organizationId: string, userId: string, data: any) {
    const { items = [], ...prData } = data;
    const number = await this.generateNumber(organizationId);
    return this.prisma.purchaseRequest.create({
      data: {
        ...prData,
        organizationId,
        requestedById: userId,
        requestNumber: number,
        status: 'pending',
        items: { create: items },
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        items: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findOne(id, organizationId);
    const { items, ...prData } = data;
    if (items) {
      await this.prisma.purchaseRequestItem.deleteMany({ where: { requestId: id } });
      return this.prisma.purchaseRequest.update({
        where: { id },
        data: { ...prData, items: { create: items } },
        include: { items: true },
      });
    }
    return this.prisma.purchaseRequest.update({ where: { id }, data: prData });
  }

  async approve(id: string, organizationId: string, approverId: string) {
    const pr = await this.findOne(id, organizationId);
    if (!['pending', 'draft'].includes(pr.status)) {
      throw new BadRequestException('Bu talep onaylanamaz');
    }
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'approved', approvedById: approverId, approvedAt: new Date() },
    });
  }

  async reject(id: string, organizationId: string, approverId: string, reason: string) {
    await this.findOne(id, organizationId);
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'rejected', approvedById: approverId, approvedAt: new Date(), rejectedReason: reason },
    });
  }

  async getStats(organizationId: string) {
    const byStatus = await this.prisma.purchaseRequest.groupBy({
      by: ['status'], where: { organizationId }, _count: true,
    });
    return { byStatus };
  }

  private async generateNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseRequest.count({ where: { organizationId } });
    return `SAT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
