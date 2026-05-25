import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { employeeId?: string; period?: string } = {}) {
    return this.prisma.performanceReview.findMany({
      where: { organizationId, ...params },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, reviewerId: string, data: Record<string, unknown>) {
    return this.prisma.performanceReview.create({
      data: { organizationId, reviewerId, ...data } as any,
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    return this.prisma.performanceReview.updateMany({ where: { id, organizationId }, data: data as any });
  }
}
