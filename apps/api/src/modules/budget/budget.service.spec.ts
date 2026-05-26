import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  budget: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  budgetLine: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('BudgetService', () => {
  let service: BudgetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('tüm bütçeleri döndürmeli', async () => {
      const budgets = [{ id: '1', name: 'Yıllık Bütçe 2025', status: 'active' }];
      mockPrisma.budget.findMany.mockResolvedValue(budgets);

      const result = await service.findAll('org-1', {});
      expect(result).toEqual(budgets);
    });

    it('status filtresi uygulanmalı', async () => {
      mockPrisma.budget.findMany.mockResolvedValue([]);
      await service.findAll('org-1', { status: 'active' });
      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1', status: 'active' } })
      );
    });
  });

  describe('findOne', () => {
    it('bütçeyi bulmalı', async () => {
      const budget = { id: '1', name: 'Test Bütçesi', lines: [] };
      mockPrisma.budget.findFirst.mockResolvedValue(budget);

      const result = await service.findOne('1', 'org-1');
      expect(result).toEqual(budget);
    });

    it('bulunamayan bütçe için exception fırlatmalı', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('toplam tutarı otomatik hesaplamali', async () => {
      const lines = [
        { category: 'personnel', description: 'Maaşlar', plannedAmount: 100000 },
        { category: 'operations', description: 'Operasyon', plannedAmount: 50000 },
      ];
      const created = { id: 'new-id', name: 'Test', totalAmount: 150000, lines };
      mockPrisma.budget.create.mockResolvedValue(created);

      await service.create('org-1', { name: 'Test', lines });
      expect(mockPrisma.budget.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalAmount: 150000 }),
        })
      );
    });
  });

  describe('getSummary', () => {
    it('bütçe özetini doğru hesaplamali', async () => {
      mockPrisma.budget.findMany.mockResolvedValue([
        {
          id: '1',
          totalAmount: 200000,
          lines: [
            { category: 'personnel', plannedAmount: 150000, actualAmount: 120000 },
            { category: 'operations', plannedAmount: 50000, actualAmount: 40000 },
          ],
        },
      ]);

      const summary = await service.getSummary('org-1');
      expect(summary.totalPlanned).toBe(200000);
      expect(summary.totalActual).toBe(160000);
      expect(summary.variance).toBe(40000);
      expect(summary.utilizationRate).toBeCloseTo(80, 1);
    });
  });
});
