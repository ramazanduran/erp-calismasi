import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: { page?: number; limit?: number; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' as const } },
          { lastName: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          phone: true,
          status: true,
          locale: true,
          lastLoginAt: true,
          createdAt: true,
          role: { select: { id: true, name: true, slug: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
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
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        status: true,
        locale: true,
        timezone: true,
        preferences: true,
        twoFactorEnabled: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, name: true, slug: true, permissions: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    const { passwordHash, twoFactorSecret, ...safeData } = data as Record<string, unknown>;
    void passwordHash; void twoFactorSecret;

    return this.prisma.user.update({
      where: { id },
      data: safeData as Parameters<typeof this.prisma.user.update>[0]['data'],
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatarUrl: true, status: true, updatedAt: true,
      },
    });
  }

  async deactivate(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
