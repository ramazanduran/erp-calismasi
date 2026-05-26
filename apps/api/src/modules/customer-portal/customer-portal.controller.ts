import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerPortalService } from './customer-portal.service';

@ApiTags('customer-portal')
@Controller('api/v1/customer-portal')
export class CustomerPortalController {
  constructor(private svc: CustomerPortalService) {}

  // ─── Token Management (requires JWT auth) ─────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('tokens')
  findTokens(@Request() req: any, @Query('customerId') customerId?: string) {
    return this.svc.findTokens(req.user.organizationId, customerId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('tokens/customer/:customerId')
  createToken(@Request() req: any, @Param('customerId') customerId: string, @Body() body: any) {
    return this.svc.createToken(req.user.organizationId, customerId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('tokens/:tokenId/revoke')
  revokeToken(@Request() req: any, @Param('tokenId') tokenId: string) {
    return this.svc.revokeToken(req.user.organizationId, tokenId);
  }

  // ─── Portal Access (token-based, no JWT) ──────────────────────────────────
  @Get('portal/data')
  getPortalData(@Headers('x-portal-token') token: string) {
    return this.svc.getPortalData(token);
  }

  @Get('portal/track/:trackingNumber')
  trackShipment(@Headers('x-portal-token') token: string, @Param('trackingNumber') trackingNumber: string) {
    return this.svc.trackShipment(token, trackingNumber);
  }
}
