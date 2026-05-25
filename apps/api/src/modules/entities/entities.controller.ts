import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EntitiesService } from './entities.service';

@ApiTags('entities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meta/entities')
export class EntitiesController {
  constructor(private entitiesService: EntitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm entity tanımları' })
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.entitiesService.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Entity detayı' })
  findOne(@Param('id') id: string, @CurrentUser() user: { organizationId: string }) {
    return this.entitiesService.findOne(id, user.organizationId);
  }

  @Post()
  @RequirePermissions('admin.entities')
  @ApiOperation({ summary: 'Yeni entity oluştur' })
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() body: Record<string, unknown>
  ) {
    return this.entitiesService.create(user.organizationId, body);
  }

  @Patch(':id')
  @RequirePermissions('admin.entities')
  @ApiOperation({ summary: 'Entity güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.entitiesService.update(id, user.organizationId, body);
  }

  @Post(':id/fields')
  @RequirePermissions('admin.entities')
  @ApiOperation({ summary: 'Entity\'e alan ekle' })
  addField(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.entitiesService.addField(id, user.organizationId, body);
  }

  @Delete(':entityId/fields/:fieldId')
  @RequirePermissions('admin.entities')
  @ApiOperation({ summary: 'Alan sil' })
  removeField(
    @Param('entityId') entityId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.entitiesService.removeField(fieldId, entityId, user.organizationId);
  }
}
