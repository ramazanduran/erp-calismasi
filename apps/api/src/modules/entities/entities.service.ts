import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.entityDefinition.findMany({
      where: { organizationId, status: 'active' },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const entity = await this.prisma.entityDefinition.findFirst({
      where: { id, organizationId },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!entity) throw new NotFoundException('Entity tanımı bulunamadı');
    return entity;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.entityDefinition.create({
      data: { organizationId, ...data } as Parameters<typeof this.prisma.entityDefinition.create>[0]['data'],
      include: { fields: true },
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.entityDefinition.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.entityDefinition.update>[0]['data'],
    });
  }

  async addField(entityId: string, organizationId: string, fieldData: Record<string, unknown>) {
    await this.findOne(entityId, organizationId);
    return this.prisma.fieldDefinition.create({
      data: { entityId, ...fieldData } as Parameters<typeof this.prisma.fieldDefinition.create>[0]['data'],
    });
  }

  async removeField(fieldId: string, entityId: string, organizationId: string) {
    await this.findOne(entityId, organizationId);
    const field = await this.prisma.fieldDefinition.findFirst({ where: { id: fieldId, entityId } });
    if (!field) throw new NotFoundException('Alan bulunamadı');
    if (field.isSystem) throw new Error('Sistem alanları silinemez');
    return this.prisma.fieldDefinition.delete({ where: { id: fieldId } });
  }
}
