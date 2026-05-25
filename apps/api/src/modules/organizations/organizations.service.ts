import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organizasyon bulunamadı');
    return org;
  }

  async update(id: string, data: { name?: string; settings?: Record<string, unknown>; theme?: Record<string, unknown>; locale?: string; timezone?: string; currency?: string }) {
    await this.findOne(id);
    return this.prisma.organization.update({ where: { id }, data });
  }

  async getStats(id: string) {
    const [userCount, roleCount] = await Promise.all([
      this.prisma.user.count({ where: { organizationId: id, status: 'active' } }),
      this.prisma.role.count({ where: { organizationId: id } }),
    ]);
    return { userCount, roleCount };
  }
}
