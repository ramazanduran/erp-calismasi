import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; org: string; role: string; permissions: string[] }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true, organization: true },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      organizationId: user.organizationId,
      organizationSlug: user.organization.slug,
      role: payload.role,
      permissions: payload.permissions,
      locale: user.locale,
      timezone: user.timezone,
    };
  }
}
