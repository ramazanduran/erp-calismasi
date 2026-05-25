import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: { page?: number; limit?: number; search?: string; departmentId?: string; status?: string },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(query.departmentId && { departmentId: query.departmentId }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' as const } },
          { lastName: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { employeeNumber: { contains: query.search, mode: 'insensitive' as const } },
          { position: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          departmentId: true,
          position: true,
          startDate: true,
          status: true,
          salary: true,
          salaryType: true,
          createdAt: true,
        },
      }),
      this.prisma.employee.count({ where }),
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
    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId },
    });
    if (!employee) throw new NotFoundException('Çalışan bulunamadı');
    return employee;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.employee.create({
      data: {
        ...(data as Parameters<typeof this.prisma.employee.create>[0]['data']),
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.employee.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.employee.update>[0]['data'],
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.employee.delete({ where: { id } });
  }
}
