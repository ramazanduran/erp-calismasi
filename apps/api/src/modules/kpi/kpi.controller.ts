import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KpiService } from './kpi.service';

@ApiTags('kpi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/kpi')
export class KpiController {
  constructor(private svc: KpiService) {}

  @Get('dashboard')
  dashboard(@Request() req: any, @Query('period') period: string) {
    const p = period ?? new Date().toISOString().slice(0, 7); // default to current month
    return this.svc.getDashboard(req.user.organizationId, p);
  }

  @Get()
  findAll(@Request() req: any, @Query() q: any) {
    return this.svc.findAll(req.user.organizationId, {
      category: q.category,
      isActive: q.isActive !== undefined ? q.isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.svc.findOne(req.user.organizationId, id);
  }

  @Get(':id/trend')
  getTrend(@Request() req: any, @Param('id') id: string, @Query('periods') periods: string) {
    return this.svc.getTrend(req.user.organizationId, id, periods ? +periods : 12);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.svc.create(req.user.organizationId, body);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.update(req.user.organizationId, id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.delete(req.user.organizationId, id);
  }

  @Post(':id/values')
  recordValue(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.recordValue(req.user.organizationId, id, req.user.id, body.period, body.value, body.notes);
  }

  @Post(':id/targets')
  setTarget(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.setTarget(req.user.organizationId, id, body.period, body.target, body.warning, body.critical);
  }
}
