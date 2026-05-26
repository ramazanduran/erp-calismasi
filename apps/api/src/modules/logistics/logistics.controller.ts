import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LogisticsService } from './logistics.service';

@ApiTags('Logistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logistics/shipments')
export class LogisticsController {
  constructor(private service: LogisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Sevkiyat listesi' })
  findAll(
    @Request() req: { user: { org: string } },
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.service.findAll(req.user.org, { status, customerId, orderId });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lojistik istatistikleri' })
  getStats(@Request() req: { user: { org: string } }) {
    return this.service.getStats(req.user.org);
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Takip numarası ile sorgula (public)' })
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.service.findByTracking(trackingNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sevkiyat detayı' })
  findOne(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.org);
  }

  @Post()
  @ApiOperation({ summary: 'Sevkiyat oluştur' })
  create(@Request() req: { user: { org: string } }, @Body() body: Record<string, unknown>) {
    return this.service.create(req.user.org, body);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Sevkiyat durumu güncelle' })
  updateStatus(
    @Request() req: { user: { org: string } },
    @Param('id') id: string,
    @Body() body: { status: string; location?: string; description?: string },
  ) {
    return this.service.updateStatus(id, req.user.org, body.status, body.location, body.description);
  }
}
