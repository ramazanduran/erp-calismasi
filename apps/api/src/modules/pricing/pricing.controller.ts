import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PriceListsService } from './price-lists.service';

@Controller('api/v1/pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private service: PriceListsService) {}

  @Get()
  findAll(@CurrentUser() user: any) { return this.service.findAll(user.org); }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) { return this.service.findOne(id, user.org); }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) { return this.service.create(user.org, body); }

  @Post(':id/items')
  addItem(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.addItem(id, user.org, body);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('itemId') itemId: string) { return this.service.removeItem(itemId); }
}
