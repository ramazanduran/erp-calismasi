import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      roleId?: string;
      departmentId?: string;
    }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId,
      ...(query.status && { status: query.status }),
      ...(query.roleId && { roleId: query.roleId }),
      ...(query.departmentId && { departmentId: query.departmentId }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where as Parameters<typeof this.prisma.user.findMany>[0]['where'],
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
      this.prisma.user.count({ where: where as Parameters<typeof this.prisma.user.count>[0]['where'] }),
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

  async create(
    organizationId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      roleId?: string;
      departmentId?: string;
      phone?: string;
    }
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email, organizationId },
    });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const tempPassword = randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        organizationId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        phone: data.phone,
        roleId: data.roleId || null,
        departmentId: data.departmentId || null,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return { ...user, tempPassword };
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    const { passwordHash, twoFactorSecret, ...safeData } = data as Record<string, unknown>;
    void passwordHash;
    void twoFactorSecret;

    return this.prisma.user.update({
      where: { id },
      data: safeData as Parameters<typeof this.prisma.user.update>[0]['data'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
        updatedAt: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async setStatus(id: string, organizationId: string, status: string) {
    await this.findOne(id, organizationId);
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }

  async deactivate(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.user.delete({ where: { id } });
  }

  async resetPassword(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    const tempPassword = randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { tempPassword };
  }
}
