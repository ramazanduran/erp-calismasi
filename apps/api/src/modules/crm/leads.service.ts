import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    params: { page?: number; limit?: number; search?: string; status?: string; source?: string } = {},
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId,
      ...(params.status && { status: params.status }),
      ...(params.source && { source: params.source }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
          { company: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where: where as Parameters<typeof this.prisma.lead.findMany>[0]['where'],
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where: where as Parameters<typeof this.prisma.lead.count>[0]['where'] }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, organizationId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, organizationId } });
    if (!lead) throw new NotFoundException('Lead bulunamadı');
    return lead;
  }

  async create(organizationId: string, createdById: string, data: Record<string, unknown>) {
    return this.prisma.lead.create({
      data: {
        ...(data as Parameters<typeof this.prisma.lead.create>[0]['data']),
        organizationId,
        createdById,
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.lead.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.lead.update>[0]['data'],
    });
  }

  async updateStatus(id: string, organizationId: string, status: string) {
    await this.findOne(id, organizationId);
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.lead.delete({ where: { id } });
  }
}
