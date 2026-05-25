import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService
  ) {}

  async validateUser(email: string, password: string, organizationSlug?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        organization: organizationSlug ? { slug: organizationSlug } : undefined,
        status: 'active',
      },
      include: {
        role: true,
        organization: true,
      },
    });

    if (!user) throw new UnauthorizedException('E-posta veya şifre hatalı');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('E-posta veya şifre hatalı');

    return user;
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(dto.email, dto.password, dto.organizationSlug);

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return { requiresTwoFactor: true };
      }
      const isValid = authenticator.verify({
        token: dto.twoFactorCode,
        secret: user.twoFactorSecret!,
      });
      if (!isValid) throw new UnauthorizedException('Geçersiz 2FA kodu');
    }

    const tokens = await this.generateTokens(user);

    // Save session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async register(dto: RegisterDto) {
    // Check if organization slug exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug || this.generateSlug(dto.organizationName || dto.email) },
    });

    let organizationId: string;

    if (dto.organizationName && !existingOrg) {
      const slug = dto.organizationSlug || this.generateSlug(dto.organizationName);
      const org = await this.prisma.organization.create({
        data: { name: dto.organizationName, slug },
      });
      organizationId = org.id;
    } else if (existingOrg) {
      organizationId = existingOrg.id;
    } else {
      throw new BadRequestException('Organizasyon adı gereklidir');
    }

    // Check if email exists in this org
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, organizationId },
    });
    if (existingUser) throw new ConflictException('Bu e-posta adresi zaten kullanımda');

    // Find or create default role
    let defaultRole = await this.prisma.role.findFirst({
      where: { organizationId, slug: 'member' },
    });
    if (!defaultRole) {
      defaultRole = await this.prisma.role.create({
        data: {
          organizationId,
          name: 'Üye',
          slug: 'member',
          permissions: ['dashboard.read'],
          isSystem: true,
        },
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        organizationId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: defaultRole.id,
      },
      include: { role: true, organization: true },
    });

    const tokens = await this.generateTokens(user);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { refreshToken, isRevoked: false },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: { role: true, organization: true },
    });
    if (!user || user.status !== 'active') throw new UnauthorizedException();

    // Rotate refresh token
    const tokens = await this.generateTokens(user);
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken: tokens.refreshToken, expiresAt: new Date(Date.now() + 7 * 86400000) },
    });

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async logout(refreshToken: string) {
    await this.prisma.userSession.updateMany({
      where: { refreshToken },
      data: { isRevoked: true },
    });
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'ERP System', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, backupCodes },
    });

    return { secret, qrCodeUrl, backupCodes };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) throw new BadRequestException('2FA kurulumu başlatılmamış');

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) throw new BadRequestException('Geçersiz doğrulama kodu');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled) throw new BadRequestException('2FA zaten devre dışı');

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret! });
    if (!isValid) throw new BadRequestException('Geçersiz doğrulama kodu');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: [] },
    });
  }

  private async generateTokens(user: { id: string; organizationId: string; role: { slug: string; permissions: string[] } | null }) {
    const payload = {
      sub: user.id,
      org: user.organizationId,
      role: user.role?.slug || 'member',
      permissions: user.role?.permissions || [],
      jti: uuidv4(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(
        { sub: user.id, jti: uuidv4() },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
        }
      ),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash, twoFactorSecret, backupCodes, ...safe } = user;
    void passwordHash; void twoFactorSecret; void backupCodes;
    return safe;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
}
