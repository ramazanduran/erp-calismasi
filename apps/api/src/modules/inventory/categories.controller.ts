import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';

@ApiTags('inventory/categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Kategori listesi' })
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.categoriesService.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kategori detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.categoriesService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Kategori oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.categoriesService.create(user.organizationId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kategori güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.categoriesService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kategori sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.categoriesService.remove(id, user.organizationId);
  }
}
