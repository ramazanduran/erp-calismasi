import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(organizationId: string, query: string) {
    if (!query || query.length < 2) {
      return { customers: [], products: [], orders: [], employees: [] };
    }

    const [customers, products, orders, employees] = await Promise.all([
      this.prisma.customer.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, code: true, email: true },
      }),
      this.prisma.product.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, code: true, currentStock: true },
      }),
      this.prisma.order.findMany({
        where: {
          organizationId,
          orderNumber: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, orderNumber: true, status: true, totalAmount: true },
      }),
      this.prisma.employee.findMany({
        where: {
          organizationId,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { employeeNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, position: true },
      }),
    ]);

    return { customers, products, orders, employees };
  }

  async indexDocument(organizationId: string, indexName: string, document: Record<string, unknown>) {
    // Legacy method kept for compatibility
    void organizationId;
    void indexName;
    void document;
    return { success: true };
  }

  async deleteDocument(organizationId: string, indexName: string, documentId: string) {
    // Legacy method kept for compatibility
    void organizationId;
    void indexName;
    void documentId;
    return { success: true };
  }
}
