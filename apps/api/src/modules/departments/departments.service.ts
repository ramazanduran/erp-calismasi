import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const departments = await this.prisma.department.findMany({
      where: { organizationId },
      include: {
        _count: { select: { users: true, children: true } },
        parent: { select: { id: true, name: true } },
        children: {
          include: { _count: { select: { users: true, children: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Return top-level departments (no parent) with nested children
    const topLevel = departments.filter((d) => !d.parentId);
    return topLevel;
  }

  async findOne(id: string, organizationId: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { users: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
      },
    });
    if (!dept) throw new NotFoundException('Departman bulunamadı');
    return dept;
  }

  async create(
    organizationId: string,
    data: { name: string; description?: string; parentId?: string; managerId?: string }
  ) {
    return this.prisma.department.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        parentId: data.parentId || null,
        managerId: data.managerId || null,
      },
      include: { _count: { select: { users: true } } },
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: { name?: string; description?: string; parentId?: string; managerId?: string }
  ) {
    await this.findOne(id, organizationId);
    return this.prisma.department.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId !== undefined && { parentId: data.parentId || null }),
        ...(data.managerId !== undefined && { managerId: data.managerId || null }),
      },
      include: { _count: { select: { users: true } } },
    });
  }

  async remove(id: string, organizationId: string) {
    const dept = await this.findOne(id, organizationId);
    const userCount = await this.prisma.user.count({ where: { departmentId: id } });
    if (userCount > 0) throw new ConflictException(`Bu departmanda ${userCount} kullanıcı var`);
    const childCount = await this.prisma.department.count({ where: { parentId: id } });
    if (childCount > 0) throw new ConflictException('Alt departmanları olan departman silinemez');
    void dept;
    return this.prisma.department.delete({ where: { id } });
  }
}
