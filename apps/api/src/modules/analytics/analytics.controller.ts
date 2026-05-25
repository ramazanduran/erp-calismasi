import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Genel dashboard metrikleri' })
  getDashboard(@CurrentUser() user: { organizationId: string }) {
    return this.analyticsService.getDashboard(user.organizationId);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Satış analitikleri' })
  getSales(
    @CurrentUser() user: { organizationId: string },
    @Query('period') period?: string,
  ) {
    return this.analyticsService.getSalesAnalytics(user.organizationId, period);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Stok analitikleri' })
  getInventory(@CurrentUser() user: { organizationId: string }) {
    return this.analyticsService.getInventoryAnalytics(user.organizationId);
  }

  @Get('finance')
  @ApiOperation({ summary: 'Finans analitikleri' })
  getFinance(
    @CurrentUser() user: { organizationId: string },
    @Query('period') period?: string,
  ) {
    return this.analyticsService.getFinanceAnalytics(user.organizationId, period);
  }

  @Get('hr')
  @ApiOperation({ summary: 'IK analitikleri' })
  getHR(@CurrentUser() user: { organizationId: string }) {
    return this.analyticsService.getHRAnalytics(user.organizationId);
  }
}
