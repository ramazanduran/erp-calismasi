import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceService } from './maintenance.service';

@ApiTags('maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/maintenance')
export class MaintenanceController {
  constructor(private svc: MaintenanceService) {}

  @Get('stats')
  stats(@Request() req: any) {
    return this.svc.getStats(req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any, @Query() q: any) {
    return this.svc.findAll(req.user.organizationId, { status: q.status, priority: q.priority, category: q.category });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.svc.findOne(req.user.organizationId, id);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.svc.create(req.user.organizationId, req.user.id, body);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.update(req.user.organizationId, id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.delete(req.user.organizationId, id);
  }

  @Post(':id/comments')
  addComment(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.addComment(req.user.organizationId, id, req.user.id, body);
  }
}
