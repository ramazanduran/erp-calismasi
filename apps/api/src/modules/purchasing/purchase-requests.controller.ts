import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PurchaseRequestsService } from './purchase-requests.service';

@Controller('api/v1/purchase-requests')
@UseGuards(JwtAuthGuard)
export class PurchaseRequestsController {
  constructor(private service: PurchaseRequestsService) {}

  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.service.getStats(user.org);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.service.findAll(user.org, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.org);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.org, user.sub, body);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.update(id, user.org, body);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.approve(id, user.org, user.sub);
  }

  @Put(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { reason: string }) {
    return this.service.reject(id, user.org, user.sub, body.reason);
  }
}
