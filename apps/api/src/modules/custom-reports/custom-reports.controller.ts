import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomReportsService } from './custom-reports.service';

@ApiTags('Custom Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('custom-reports')
export class CustomReportsController {
  constructor(private service: CustomReportsService) {}

  @Get('data-sources')
  @ApiOperation({ summary: 'Veri kaynakları' })
  getDataSources() {
    return this.service.getDataSources();
  }

  @Get()
  @ApiOperation({ summary: 'Kayıtlı raporlar' })
  findAll(@Request() req: { user: { org: string } }) {
    return this.service.findAll(req.user.org);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Rapor detayı' })
  findOne(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.org);
  }

  @Post('run')
  @ApiOperation({ summary: 'Rapor çalıştır' })
  run(
    @Request() req: { user: { org: string } },
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.run({ organizationId: req.user.org, ...body } as Parameters<CustomReportsService['run']>[0]);
  }

  @Post()
  @ApiOperation({ summary: 'Rapor kaydet' })
  save(
    @Request() req: { user: { org: string; sub: string } },
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.save(req.user.org, req.user.sub, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Rapor güncelle' })
  update(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, req.user.org, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Rapor sil' })
  delete(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.delete(id, req.user.org);
  }
}
