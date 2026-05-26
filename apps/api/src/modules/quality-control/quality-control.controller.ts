import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QualityControlService } from './quality-control.service';

@ApiTags('quality-control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/quality-control')
export class QualityControlController {
  constructor(private svc: QualityControlService) {}

  @Get('stats')
  stats(@Request() req: any) {
    return this.svc.getStats(req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any, @Query() q: any) {
    return this.svc.findAll(req.user.organizationId, {
      status: q.status,
      type: q.type,
      limit: q.limit ? +q.limit : undefined,
      offset: q.offset ? +q.offset : undefined,
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.svc.findOne(req.user.organizationId, id);
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

  @Post(':id/defects')
  addDefect(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.addDefect(req.user.organizationId, id, body);
  }

  @Put(':id/defects/:defectId/resolve')
  resolveDefect(@Request() req: any, @Param('id') id: string, @Param('defectId') defectId: string, @Body() body: any) {
    return this.svc.resolveDefect(req.user.organizationId, id, defectId, body.resolution);
  }

  @Put(':id/check-items/:itemId')
  updateCheckItem(@Request() req: any, @Param('id') id: string, @Param('itemId') itemId: string, @Body() body: any) {
    return this.svc.updateCheckItem(req.user.organizationId, id, itemId, body);
  }
}
