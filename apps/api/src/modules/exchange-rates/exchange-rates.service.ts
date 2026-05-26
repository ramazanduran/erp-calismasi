import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ExchangeRatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { baseCurrency?: string; date?: string }) {
    const where: Record<string, unknown> = { organizationId };
    if (params.baseCurrency) where.baseCurrency = params.baseCurrency;
    if (params.date) where.date = new Date(params.date);

    return this.prisma.exchangeRate.findMany({
      where,
      orderBy: [{ date: 'desc' }, { baseCurrency: 'asc' }],
    });
  }

  async getLatest(organizationId: string, baseCurrency = 'TRY') {
    const rates = await this.prisma.exchangeRate.findMany({
      where: { organizationId, baseCurrency },
      orderBy: { date: 'desc' },
      distinct: ['targetCurrency'],
    });
    return rates;
  }

  async upsertRate(organizationId: string, data: {
    baseCurrency: string;
    targetCurrency: string;
    rate: number;
    date: string;
    source?: string;
  }) {
    return this.prisma.exchangeRate.upsert({
      where: {
        organizationId_baseCurrency_targetCurrency_date: {
          organizationId,
          baseCurrency: data.baseCurrency,
          targetCurrency: data.targetCurrency,
          date: new Date(data.date),
        },
      },
      update: { rate: data.rate, source: data.source ?? 'manual' },
      create: {
        organizationId,
        baseCurrency: data.baseCurrency,
        targetCurrency: data.targetCurrency,
        rate: data.rate,
        date: new Date(data.date),
        source: data.source ?? 'manual',
      },
    });
  }

  async bulkUpsert(organizationId: string, rates: Array<{
    baseCurrency: string;
    targetCurrency: string;
    rate: number;
    date: string;
    source?: string;
  }>) {
    const results = await Promise.all(rates.map((r) => this.upsertRate(organizationId, r)));
    return results;
  }

  async convert(organizationId: string, amount: number, from: string, to: string, date?: string) {
    if (from === to) return { amount, rate: 1, from, to };

    const queryDate = date ? new Date(date) : new Date();
    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        organizationId,
        baseCurrency: from,
        targetCurrency: to,
        date: { lte: queryDate },
      },
      orderBy: { date: 'desc' },
    });

    if (!rate) {
      const inverse = await this.prisma.exchangeRate.findFirst({
        where: {
          organizationId,
          baseCurrency: to,
          targetCurrency: from,
          date: { lte: queryDate },
        },
        orderBy: { date: 'desc' },
      });
      if (inverse) {
        const r = 1 / Number(inverse.rate);
        return { amount: amount * r, rate: r, from, to };
      }
      return null;
    }

    return { amount: amount * Number(rate.rate), rate: Number(rate.rate), from, to };
  }

  async delete(id: string, organizationId: string) {
    return this.prisma.exchangeRate.deleteMany({ where: { id, organizationId } });
  }
}
