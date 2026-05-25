import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';

@ApiTags('sales/orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Sipariş listesi' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; search?: string; status?: string; type?: string },
  ) {
    return this.ordersService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sipariş detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.ordersService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Sipariş oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string; id: string },
  ) {
    return this.ordersService.create(user.organizationId, user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sipariş güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.ordersService.update(id, user.organizationId, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Sipariş durumunu değiştir' })
  changeStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.ordersService.changeStatus(id, user.organizationId, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Sipariş sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.ordersService.remove(id, user.organizationId);
  }
}
