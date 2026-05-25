import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('admin.users')
  @ApiOperation({ summary: 'Kullanıcıları listele' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; search?: string; status?: string; roleId?: string; departmentId?: string }
  ) {
    return this.usersService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions('admin.users')
  @ApiOperation({ summary: 'Kullanıcı detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.usersService.findOne(id, user.organizationId);
  }

  @Post()
  @RequirePermissions('admin.users')
  @ApiOperation({ summary: 'Yeni kullanıcı oluştur' })
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() body: { email: string; firstName: string; lastName: string; roleId?: string; departmentId?: string; phone?: string }
  ) {
    return this.usersService.create(user.organizationId, body);
  }

  @Patch(':id')
  @RequirePermissions('admin.users')
  @ApiOperation({ summary: 'Kullanıcı güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.usersService.update(id, user.organizationId, body);
  }

  @Patch(':id/status')
  @RequirePermissions('admin.users')
  @ApiOperation({ summary: 'Kullanıcı durumunu güncelle' })
  setStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.usersService.setStatus(id, user.organizationId, body.status);
  }

  @Delete(':id')
  @RequirePermissions('admin.users')
  @ApiOperation({ summary: 'Kullanıcı sil' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.usersService.delete(id, user.organizationId);
  }

  @Post(':id/reset-password')
  @RequirePermissions('admin.users')
  @ApiOperation({ summary: 'Geçici şifre oluştur' })
  resetPassword(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.usersService.resetPassword(id, user.organizationId);
  }
}
