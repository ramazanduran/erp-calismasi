import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.productCategory.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: {
        children: { select: { id: true, name: true, slug: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id, organizationId },
      include: {
        children: true,
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });
    if (!category) throw new NotFoundException('Kategori bulunamadı');
    return category;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.productCategory.create({
      data: {
        ...(data as Parameters<typeof this.prisma.productCategory.create>[0]['data']),
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.productCategory.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.productCategory.update>[0]['data'],
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.productCategory.delete({ where: { id } });
  }
}
