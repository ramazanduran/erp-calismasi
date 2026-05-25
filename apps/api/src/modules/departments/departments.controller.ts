import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DepartmentsService } from './departments.service';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions('admin.settings')
  @ApiOperation({ summary: 'Departmanları listele (tree)' })
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.departmentsService.findAll(user.organizationId);
  }

  @Post()
  @RequirePermissions('admin.settings')
  @ApiOperation({ summary: 'Departman oluştur' })
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() body: { name: string; description?: string; parentId?: string; managerId?: string }
  ) {
    return this.departmentsService.create(user.organizationId, body);
  }

  @Patch(':id')
  @RequirePermissions('admin.settings')
  @ApiOperation({ summary: 'Departman güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; parentId?: string; managerId?: string },
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.departmentsService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @RequirePermissions('admin.settings')
  @ApiOperation({ summary: 'Departman sil' })
  remove(@Param('id') id: string, @CurrentUser() user: { organizationId: string }) {
    return this.departmentsService.remove(id, user.organizationId);
  }
}
