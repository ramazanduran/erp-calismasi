import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const role = await this.prisma.role.findFirst({ where: { id, organizationId } });
    if (!role) throw new NotFoundException('Rol bulunamadı');
    return role;
  }

  async create(organizationId: string, data: { name: string; slug: string; description?: string; permissions: string[]; parentId?: string }) {
    const existing = await this.prisma.role.findFirst({ where: { organizationId, slug: data.slug } });
    if (existing) throw new ConflictException('Bu slug zaten kullanımda');
    return this.prisma.role.create({ data: { organizationId, ...data } });
  }

  async update(id: string, organizationId: string, data: { name?: string; description?: string; permissions?: string[] }) {
    await this.findOne(id, organizationId);
    return this.prisma.role.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    const role = await this.findOne(id, organizationId);
    if (role.isSystem) throw new ConflictException('Sistem rolleri silinemez');
    const userCount = await this.prisma.user.count({ where: { roleId: id } });
    if (userCount > 0) throw new ConflictException(`Bu role atanmış ${userCount} kullanıcı var`);
    return this.prisma.role.delete({ where: { id } });
  }
}
