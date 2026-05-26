import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DealsService } from './deals.service';

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private service: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'Fırsat listesi' })
  findAll(
    @Request() req: { user: { org: string } },
    @Query('stage') stage?: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.service.findAll(req.user.org, { stage, assignedUserId, customerId });
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Satış pipeline (kanban)' })
  getPipeline(@Request() req: { user: { org: string } }) {
    return this.service.getPipeline(req.user.org);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Fırsat istatistikleri' })
  getStats(@Request() req: { user: { org: string } }) {
    return this.service.getStats(req.user.org);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fırsat detayı' })
  findOne(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.org);
  }

  @Post()
  @ApiOperation({ summary: 'Fırsat oluştur' })
  create(@Request() req: { user: { org: string } }, @Body() body: Record<string, unknown>) {
    return this.service.create(req.user.org, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Fırsat güncelle' })
  update(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, req.user.org, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Fırsat sil' })
  delete(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.delete(id, req.user.org);
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Aktivite ekle' })
  addActivity(
    @Request() req: { user: { org: string } },
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.addActivity(id, req.user.org, body);
  }

  @Put(':id/activities/:activityId/complete')
  @ApiOperation({ summary: 'Aktiviteyi tamamla' })
  completeActivity(
    @Request() req: { user: { org: string } },
    @Param('id') id: string,
    @Param('activityId') activityId: string,
  ) {
    return this.service.completeActivity(activityId, id, req.user.org);
  }
}
