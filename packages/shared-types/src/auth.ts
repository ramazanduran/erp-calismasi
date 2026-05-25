export interface JWTPayload {
  sub: string;
  org: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string;
}

export interface LoginDto {
  email: string;
  password: string;
  organizationSlug?: string;
  twoFactorCode?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  organizationSlug?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  organizationId: string;
  organizationSlug: string;
  permissions: string[];
  locale: string;
  timezone: string;
}

export interface UserRole {
  id: string;
  name: string;
  slug: string;
  permissions: string[];
}

export type OAuthProvider = 'google' | 'microsoft' | 'github';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
