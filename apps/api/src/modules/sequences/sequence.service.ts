import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SequenceService {
  constructor(private prisma: PrismaService) {}

  async next(organizationId: string, type: string, prefix: string = '', padding: number = 6): Promise<string> {
    const seq = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.sequence.findUnique({
        where: { organizationId_type: { organizationId, type } },
      });
      if (existing) {
        return tx.sequence.update({
          where: { organizationId_type: { organizationId, type } },
          data: { currentValue: { increment: 1 } },
        });
      }
      return tx.sequence.create({
        data: { organizationId, type, prefix, currentValue: 1, padding },
      });
    });
    const padded = String(seq.currentValue).padStart(seq.padding, '0');
    return `${seq.prefix || prefix}${padded}`;
  }
}
