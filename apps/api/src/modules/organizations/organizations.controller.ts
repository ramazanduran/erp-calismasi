import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private service: OrganizationsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Mevcut organizasyon bilgileri' })
  getCurrent(@CurrentUser() user: { organizationId: string }) {
    return this.service.findOne(user.organizationId);
  }

  @Get('current/stats')
  @ApiOperation({ summary: 'Organizasyon istatistikleri' })
  getStats(@CurrentUser() user: { organizationId: string }) {
    return this.service.getStats(user.organizationId);
  }

  @Patch('current')
  @ApiOperation({ summary: 'Organizasyon güncelle' })
  update(
    @CurrentUser() user: { organizationId: string },
    @Body() body: { name?: string; settings?: Record<string, unknown>; theme?: Record<string, unknown>; locale?: string; timezone?: string; currency?: string }
  ) {
    return this.service.update(user.organizationId, body);
  }
}
