import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  customer: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<CustomersService>(CustomersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return customers filtered by organizationId', async () => {
      const customers = [{ id: '1', name: 'Test Customer', organizationId: 'org-1' }];
      mockPrisma.customer.findMany.mockResolvedValue(customers);
      mockPrisma.customer.count.mockResolvedValue(1);
      const result = await service.findAll('org-1', {});
      expect(result.data).toEqual(customers);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-1' }) }));
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should return customer when found', async () => {
      const customer = { id: '1', name: 'Test', organizationId: 'org-1' };
      mockPrisma.customer.findFirst.mockResolvedValue(customer);
      const result = await service.findOne('1', 'org-1');
      expect(result).toEqual(customer);
    });
  });
});
