import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssetsService } from './assets.service';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private service: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Demirbaş listesi' })
  findAll(
    @Request() req: { user: { org: string } },
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.findAll(req.user.org, { status, categoryId });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Demirbaş özeti' })
  getSummary(@Request() req: { user: { org: string } }) {
    return this.service.getSummary(req.user.org);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Kategoriler' })
  getCategories(@Request() req: { user: { org: string } }) {
    return this.service.getCategories(req.user.org);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Demirbaş detayı' })
  findOne(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.org);
  }

  @Get(':id/depreciation-schedule')
  @ApiOperation({ summary: 'Amortisman planı' })
  getDepreciationSchedule(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.calculateDepreciation(id, req.user.org);
  }

  @Post()
  @ApiOperation({ summary: 'Demirbaş ekle' })
  create(@Request() req: { user: { org: string } }, @Body() body: Record<string, unknown>) {
    return this.service.create(req.user.org, body);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Kategori ekle' })
  createCategory(@Request() req: { user: { org: string } }, @Body() body: Record<string, unknown>) {
    return this.service.createCategory(req.user.org, body);
  }

  @Post(':id/depreciate')
  @ApiOperation({ summary: 'Amortisman hesapla & kaydet' })
  saveDepreciation(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.saveDepreciation(id, req.user.org);
  }

  @Post(':id/maintenances')
  @ApiOperation({ summary: 'Bakım kaydı ekle' })
  addMaintenance(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.addMaintenance(id, req.user.org, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Demirbaş güncelle' })
  update(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, req.user.org, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Demirbaş sil' })
  delete(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.delete(id, req.user.org);
  }
}
