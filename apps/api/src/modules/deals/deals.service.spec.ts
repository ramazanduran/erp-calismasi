import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  deal: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  dealActivity: {
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('DealsService', () => {
  let service: DealsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('organizasyona ait fırsatları döndürmeli', async () => {
      const deals = [{ id: '1', title: 'Test Fırsatı', stage: 'qualification' }];
      mockPrisma.deal.findMany.mockResolvedValue(deals);

      const result = await service.findAll('org-1', {});
      expect(result).toEqual(deals);
      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1' } })
      );
    });

    it('stage filtresi uygulanmalı', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      await service.findAll('org-1', { stage: 'won' });
      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1', stage: 'won' } })
      );
    });
  });

  describe('findOne', () => {
    it('bulunan fırsatı döndürmeli', async () => {
      const deal = { id: '1', title: 'Test', stage: 'proposal' };
      mockPrisma.deal.findFirst.mockResolvedValue(deal);

      const result = await service.findOne('1', 'org-1');
      expect(result).toEqual(deal);
    });

    it('bulunamayan fırsat için NotFoundException fırlatmalı', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('yeni fırsat oluşturmalı', async () => {
      const data = { title: 'Yeni Fırsat', value: 50000, stage: 'qualification' };
      const created = { id: 'new-id', organizationId: 'org-1', ...data };
      mockPrisma.deal.create.mockResolvedValue(created);

      const result = await service.create('org-1', data);
      expect(result).toEqual(created);
      expect(mockPrisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ organizationId: 'org-1', ...data }) })
      );
    });
  });

  describe('update', () => {
    it('fırsat güncellenmeli', async () => {
      const existing = { id: '1', title: 'Eski Ad', stage: 'qualification' };
      const updated = { ...existing, stage: 'proposal' };
      mockPrisma.deal.findFirst.mockResolvedValue(existing);
      mockPrisma.deal.update.mockResolvedValue(updated);

      const result = await service.update('1', 'org-1', { stage: 'proposal' });
      expect(result).toEqual(updated);
    });

    it('won stage için closedAt set edilmeli', async () => {
      const existing = { id: '1', title: 'Test', stage: 'negotiation' };
      mockPrisma.deal.findFirst.mockResolvedValue(existing);
      mockPrisma.deal.update.mockResolvedValue({ ...existing, stage: 'won', closedAt: new Date() });

      await service.update('1', 'org-1', { stage: 'won' });
      expect(mockPrisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stage: 'won', closedAt: expect.any(Date) }),
        })
      );
    });
  });

  describe('getStats', () => {
    it('istatistikleri doğru hesaplamali', async () => {
      mockPrisma.deal.findMany
        .mockResolvedValueOnce([
          { id: '1', stage: 'won', value: '50000' },
          { id: '2', stage: 'lost', value: '30000' },
          { id: '3', stage: 'proposal', value: '20000' },
        ])
        .mockResolvedValueOnce([{ id: '1', stage: 'won', value: '50000' }])
        .mockResolvedValueOnce([{ id: '2', stage: 'lost', value: '30000' }]);

      const stats = await service.getStats('org-1');
      expect(stats.totalDeals).toBe(3);
      expect(stats.wonDeals).toBe(1);
      expect(stats.lostDeals).toBe(1);
      expect(stats.openDeals).toBe(1);
    });
  });
});
