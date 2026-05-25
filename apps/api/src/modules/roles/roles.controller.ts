import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'Rolleri listele' })
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.rolesService.findAll(user.organizationId);
  }

  @Post()
  @RequirePermissions('roles.write')
  @ApiOperation({ summary: 'Rol oluştur' })
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() body: { name: string; slug: string; description?: string; permissions: string[]; parentId?: string }
  ) {
    return this.rolesService.create(user.organizationId, body);
  }

  @Patch(':id')
  @RequirePermissions('roles.write')
  @ApiOperation({ summary: 'Rol güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; permissions?: string[] },
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.rolesService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @RequirePermissions('roles.delete')
  @ApiOperation({ summary: 'Rol sil' })
  remove(@Param('id') id: string, @CurrentUser() user: { organizationId: string }) {
    return this.rolesService.remove(id, user.organizationId);
  }
}
