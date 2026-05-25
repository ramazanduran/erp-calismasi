import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesService } from './roles.service';

const AVAILABLE_PERMISSIONS = [
  'dashboard.read',
  'sales.read', 'sales.write', 'sales.delete',
  'inventory.read', 'inventory.write', 'inventory.delete',
  'finance.read', 'finance.write', 'finance.delete',
  'hr.read', 'hr.write', 'hr.delete',
  'admin.users', 'admin.roles', 'admin.settings',
];

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermissions('admin.roles')
  @ApiOperation({ summary: 'Rolleri listele' })
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.rolesService.findAll(user.organizationId);
  }

  @Get('permissions')
  @RequirePermissions('admin.roles')
  @ApiOperation({ summary: 'Kullanılabilir izin listesi' })
  getPermissions() {
    return { data: AVAILABLE_PERMISSIONS };
  }

  @Post()
  @RequirePermissions('admin.roles')
  @ApiOperation({ summary: 'Rol oluştur' })
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() body: { name: string; slug: string; description?: string; permissions: string[]; parentId?: string }
  ) {
    return this.rolesService.create(user.organizationId, body);
  }

  @Patch(':id')
  @RequirePermissions('admin.roles')
  @ApiOperation({ summary: 'Rol güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; permissions?: string[] },
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.rolesService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @RequirePermissions('admin.roles')
  @ApiOperation({ summary: 'Rol sil' })
  remove(@Param('id') id: string, @CurrentUser() user: { organizationId: string }) {
    return this.rolesService.remove(id, user.organizationId);
  }
}
