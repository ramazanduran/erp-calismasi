import { Test, TestingModule } from '@nestjs/testing';
import { SequenceService } from './sequence.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  $transaction: jest.fn(),
  sequence: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
};

describe('SequenceService', () => {
  let service: SequenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SequenceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<SequenceService>(SequenceService);
    jest.clearAllMocks();
  });

  it('should generate formatted sequence number', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
    mockPrisma.sequence.findUnique.mockResolvedValue({ id: '1', currentValue: 0, prefix: 'SIP-', padding: 6 });
    mockPrisma.sequence.update.mockResolvedValue({ currentValue: 1, prefix: 'SIP-', padding: 6 });
    const result = await service.next('org-1', 'order', 'SIP-');
    expect(result).toBe('SIP-000001');
  });
});
