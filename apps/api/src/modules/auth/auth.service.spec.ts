import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  organization: { findUnique: jest.fn(), create: jest.fn() },
  role: { findFirst: jest.fn(), create: jest.fn() },
  userSession: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('mock-token') } },
        { provide: ConfigService, useValue: { get: jest.fn((key: string, def?: unknown) => def) } },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should return user when credentials are valid', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('password', 12);
      mockPrisma.user.findFirst.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash: hash, twoFactorEnabled: false, role: null, organization: {} });
      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
    });
  });

  describe('logout', () => {
    it('should revoke session', async () => {
      mockPrisma.userSession.updateMany.mockResolvedValue({ count: 1 });
      await service.logout('refresh-token');
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { refreshToken: 'refresh-token' },
        data: { isRevoked: true },
      });
    });
  });
});
