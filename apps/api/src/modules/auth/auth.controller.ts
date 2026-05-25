import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TwoFactorDto } from './dto/two-factor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Kullanıcı girişi' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent']
    );

    if ('refreshToken' in result) {
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
      });
    }

    return result;
  }

  @Public()
  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access token yenileme' })
  async refresh(@Req() req: Request, @Body() body: { refreshToken?: string }) {
    const token = req.cookies?.refresh_token || body.refreshToken;
    return this.authService.refresh(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Çıkış yap' })
  @ApiBearerAuth()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token;
    if (token) await this.authService.logout(token);
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return { message: 'Çıkış yapıldı' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Mevcut kullanıcı bilgileri' })
  @ApiBearerAuth()
  getMe(@CurrentUser() user: unknown) {
    return user;
  }

  @Post('2fa/setup')
  @ApiOperation({ summary: '2FA kurulumu başlat' })
  @ApiBearerAuth()
  setupTwoFactor(@CurrentUser() user: { id: string }) {
    return this.authService.setupTwoFactor(user.id);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2FA etkinleştir' })
  @ApiBearerAuth()
  enableTwoFactor(@CurrentUser() user: { id: string }, @Body() dto: TwoFactorDto) {
    return this.authService.enableTwoFactor(user.id, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2FA devre dışı bırak' })
  @ApiBearerAuth()
  disableTwoFactor(@CurrentUser() user: { id: string }, @Body() dto: TwoFactorDto) {
    return this.authService.disableTwoFactor(user.id, dto.code);
  }
}
