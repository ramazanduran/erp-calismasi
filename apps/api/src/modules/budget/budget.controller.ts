import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BudgetService } from './budget.service';

@ApiTags('Budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budget')
export class BudgetController {
  constructor(private service: BudgetService) {}

  @Get()
  @ApiOperation({ summary: 'Bütçe listesi' })
  findAll(
    @Request() req: { user: { org: string } },
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('year') year?: number,
  ) {
    return this.service.findAll(req.user.org, { status, departmentId, year });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Bütçe özeti' })
  getSummary(@Request() req: { user: { org: string } }, @Query('year') year?: number) {
    return this.service.getSummary(req.user.org, year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bütçe detayı' })
  findOne(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.org);
  }

  @Post()
  @ApiOperation({ summary: 'Bütçe oluştur' })
  create(@Request() req: { user: { org: string } }, @Body() body: Record<string, unknown>) {
    return this.service.create(req.user.org, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Bütçe güncelle' })
  update(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, req.user.org, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Bütçe sil' })
  delete(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.delete(id, req.user.org);
  }

  @Put(':id/lines/:lineId/actual')
  @ApiOperation({ summary: 'Gerçekleşen bütçe güncelle' })
  updateActual(
    @Request() req: { user: { org: string } },
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body('actualAmount') actualAmount: number,
  ) {
    return this.service.updateLineActual(lineId, id, req.user.org, actualAmount);
  }
}
