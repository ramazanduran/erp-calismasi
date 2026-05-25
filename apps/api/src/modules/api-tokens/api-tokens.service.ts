import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiTokensService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, userId: string) {
    return this.prisma.apiToken.findMany({
      where: { organizationId, userId },
      select: { id: true, name: true, lastUsedAt: true, expiresAt: true, scopes: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, userId: string, data: { name: string; scopes: string[]; expiresAt?: Date }) {
    const rawToken = `erp_${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.apiToken.create({
      data: {
        organizationId,
        userId,
        name: data.name,
        tokenHash,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
        isActive: true,
      },
    });

    return { token: rawToken }; // Raw token only shown once
  }

  async revoke(id: string, organizationId: string, userId: string) {
    return this.prisma.apiToken.updateMany({
      where: { id, organizationId, userId },
      data: { isActive: false },
    });
  }

  async delete(id: string, organizationId: string, userId: string) {
    return this.prisma.apiToken.deleteMany({
      where: { id, organizationId, userId },
    });
  }
}
