import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
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
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Kullanıcıları listele' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; search?: string }
  ) {
    return this.usersService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Kullanıcı detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.usersService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions('users.write')
  @ApiOperation({ summary: 'Kullanıcı güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.usersService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  @ApiOperation({ summary: 'Kullanıcı devre dışı bırak' })
  deactivate(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.usersService.deactivate(id, user.organizationId);
  }
}
