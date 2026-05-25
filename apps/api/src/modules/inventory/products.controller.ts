import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductsService } from './products.service';

@ApiTags('inventory/products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Ürün listesi' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; search?: string; categoryId?: string; isActive?: string },
  ) {
    return this.productsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ürün detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.productsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Ürün oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.productsService.create(user.organizationId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ürün güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.productsService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Ürün sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.productsService.remove(id, user.organizationId);
  }
}
