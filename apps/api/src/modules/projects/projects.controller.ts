import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private service: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Proje listesi' })
  findAll(
    @Request() req: { user: { org: string } },
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.service.findAll(req.user.org, { status, customerId });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Proje istatistikleri' })
  getStats(@Request() req: { user: { org: string } }) {
    return this.service.getStats(req.user.org);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Proje detayı' })
  findOne(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.org);
  }

  @Get(':id/board')
  @ApiOperation({ summary: 'Proje kanban tahtası' })
  getBoard(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.getBoard(id, req.user.org);
  }

  @Post()
  @ApiOperation({ summary: 'Proje oluştur' })
  create(@Request() req: { user: { org: string } }, @Body() body: Record<string, unknown>) {
    return this.service.create(req.user.org, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Proje güncelle' })
  update(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, req.user.org, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Proje sil' })
  delete(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.delete(id, req.user.org);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Görev ekle' })
  createTask(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.createTask(id, req.user.org, body);
  }

  @Put(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Görev güncelle' })
  updateTask(
    @Request() req: { user: { org: string } },
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updateTask(taskId, id, req.user.org, body);
  }

  @Delete(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Görev sil' })
  deleteTask(
    @Request() req: { user: { org: string } },
    @Param('id') id: string,
    @Param('taskId') taskId: string,
  ) {
    return this.service.deleteTask(taskId, id, req.user.org);
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Kilometre taşı ekle' })
  createMilestone(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.createMilestone(id, req.user.org, body);
  }

  @Post(':id/time-entries')
  @ApiOperation({ summary: 'Zaman kaydı ekle' })
  logTime(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.logTime(id, req.user.org, body);
  }
}
