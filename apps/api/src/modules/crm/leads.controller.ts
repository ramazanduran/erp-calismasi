import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LeadsService } from './leads.service';

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Lead listesi' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; search?: string; status?: string; source?: string },
  ) {
    return this.leadsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lead detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.leadsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Lead oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string; id: string },
  ) {
    return this.leadsService.create(user.organizationId, user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Lead güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.leadsService.update(id, user.organizationId, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Lead durumu güncelle' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.leadsService.updateStatus(id, user.organizationId, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Lead sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.leadsService.remove(id, user.organizationId);
  }
}
