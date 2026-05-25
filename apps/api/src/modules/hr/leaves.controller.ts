import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LeavesService } from './leaves.service';

@ApiTags('hr/leaves')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hr/leaves')
export class LeavesController {
  constructor(private leavesService: LeavesService) {}

  @Get()
  @ApiOperation({ summary: 'İzin talepleri listesi' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; employeeId?: string; status?: string; type?: string },
  ) {
    return this.leavesService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'İzin talebi detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.leavesService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'İzin talebi oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.leavesService.create(user.organizationId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'İzin talebi güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.leavesService.update(id, user.organizationId, body);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'İzin talebini onayla' })
  approve(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: { organizationId: string; id: string },
  ) {
    return this.leavesService.approve(id, user.organizationId, user.id, body.notes);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'İzin talebini reddet' })
  reject(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: { organizationId: string; id: string },
  ) {
    return this.leavesService.reject(id, user.organizationId, user.id, body.notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'İzin talebi sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.leavesService.remove(id, user.organizationId);
  }
}
