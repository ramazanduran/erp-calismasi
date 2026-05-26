import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WarehousesService } from './warehouses.service';

@Controller('api/v1/warehouses')
@UseGuards(JwtAuthGuard)
export class WarehousesController {
  constructor(private service: WarehousesService) {}

  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.service.getStats(user.org);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.org);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.org);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.org, body);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.update(id, user.org, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.org);
  }

  @Post(':id/locations')
  addLocation(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.addLocation(id, user.org, body);
  }

  @Put(':id/stock/:productId')
  updateStock(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @CurrentUser() user: any,
    @Body() body: { quantity: number },
  ) {
    return this.service.updateStock(id, user.org, productId, body.quantity);
  }
}
