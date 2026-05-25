import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StockCountService } from './stock-count.service';

@Controller('api/v1/inventory/stock-counts')
@UseGuards(JwtAuthGuard)
export class StockCountController {
  constructor(private service: StockCountService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.org);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.org);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: { notes?: string }) {
    return this.service.create(user.org, user.sub, body.notes);
  }

  @Patch(':id/lines/:lineId')
  updateLine(@Param('id') id: string, @Param('lineId') lineId: string, @Body() body: { countedQty: number }) {
    return this.service.updateLine(id, lineId, body.countedQty);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.complete(id, user.org);
  }
}
