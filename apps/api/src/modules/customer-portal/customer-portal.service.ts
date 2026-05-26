import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class CustomerPortalService {
  constructor(private prisma: PrismaService) {}

  private generateToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  // ─── Token Management ──────────────────────────────────────────────────────

  async findTokens(organizationId: string, customerId?: string) {
    const where: any = { customer: { organizationId } };
    if (customerId) where.customerId = customerId;
    return this.prisma.customerPortalToken.findMany({
      where,
      include: { customer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createToken(organizationId: string, customerId: string, data: { email: string; name: string; expiresAt?: Date; permissions?: string[] }) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, organizationId } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
    return this.prisma.customerPortalToken.create({
      data: {
        customerId,
        token: this.generateToken(),
        email: data.email,
        name: data.name,
        permissions: data.permissions ?? ['orders.read', 'invoices.read', 'shipments.read'],
        expiresAt: data.expiresAt,
      },
    });
  }

  async revokeToken(organizationId: string, tokenId: string) {
    const token = await this.prisma.customerPortalToken.findFirst({
      where: { id: tokenId, customer: { organizationId } },
    });
    if (!token) throw new NotFoundException('Token bulunamadı');
    return this.prisma.customerPortalToken.update({ where: { id: tokenId }, data: { isActive: false } });
  }

  // ─── Portal Access (token-auth) ────────────────────────────────────────────

  async validateToken(token: string) {
    const pt = await this.prisma.customerPortalToken.findUnique({
      where: { token },
      include: { customer: true },
    });
    if (!pt || !pt.isActive) throw new UnauthorizedException('Geçersiz veya devre dışı token');
    if (pt.expiresAt && pt.expiresAt < new Date()) throw new UnauthorizedException('Token süresi dolmuş');
    await this.prisma.customerPortalToken.update({ where: { id: pt.id }, data: { lastUsedAt: new Date() } });
    return pt;
  }

  async getPortalData(token: string) {
    const pt = await this.validateToken(token);
    const customerId = pt.customerId;
    const permissions = pt.permissions as string[];

    const [orders, invoices, shipments] = await Promise.all([
      permissions.includes('orders.read')
        ? this.prisma.order.findMany({
            where: { customerId },
            select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : [],
      permissions.includes('invoices.read')
        ? this.prisma.invoice.findMany({
            where: { customerId },
            select: { id: true, invoiceNumber: true, status: true, totalAmount: true, dueDate: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : [],
      permissions.includes('shipments.read')
        ? this.prisma.shipment.findMany({
            where: { customerId },
            select: { id: true, trackingNumber: true, status: true, carrier: true, estimatedDelivery: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [],
    ]);

    return {
      customer: { id: pt.customer.id, name: pt.customer.name, email: pt.customer.email },
      permissions,
      orders,
      invoices,
      shipments,
    };
  }

  async trackShipment(token: string, trackingNumber: string) {
    await this.validateToken(token);
    return this.prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        events: { orderBy: { occurredAt: 'asc' } },
      },
    });
  }
}
