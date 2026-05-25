import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: { page?: number; limit?: number; employeeId?: string; status?: string; type?: string },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: { id: true, employeeNumber: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.leaveRequest.count({ where }),
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
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          select: { id: true, employeeNumber: true, firstName: true, lastName: true },
        },
      },
    });
    if (!leave) throw new NotFoundException('İzin talebi bulunamadı');
    return leave;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.leaveRequest.create({
      data: {
        ...(data as Parameters<typeof this.prisma.leaveRequest.create>[0]['data']),
        organizationId,
        status: 'pending',
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.leaveRequest.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.leaveRequest.update>[0]['data'],
    });
  }

  async approve(id: string, organizationId: string, approverId: string, notes?: string) {
    const leave = await this.findOne(id, organizationId);
    if (leave.status !== 'pending') {
      throw new BadRequestException('Sadece bekleyen izin talepleri onaylanabilir');
    }
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: approverId,
        notes: notes ?? leave.notes,
      },
    });
  }

  async reject(id: string, organizationId: string, approverId: string, notes?: string) {
    const leave = await this.findOne(id, organizationId);
    if (leave.status !== 'pending') {
      throw new BadRequestException('Sadece bekleyen izin talepleri reddedilebilir');
    }
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedById: approverId,
        notes: notes ?? leave.notes,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const leave = await this.findOne(id, organizationId);
    if (leave.status !== 'pending') {
      throw new BadRequestException('Sadece bekleyen izin talepleri silinebilir');
    }
    return this.prisma.leaveRequest.delete({ where: { id } });
  }
}
