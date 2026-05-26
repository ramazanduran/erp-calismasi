import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ManufacturingService } from './manufacturing.service';

@ApiTags('manufacturing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/manufacturing')
export class ManufacturingController {
  constructor(private svc: ManufacturingService) {}

  @Get('stats')
  stats(@Request() req: any) {
    return this.svc.getStats(req.user.organizationId);
  }

  // Work Centers
  @Get('work-centers')
  findWorkCenters(@Request() req: any) {
    return this.svc.findWorkCenters(req.user.organizationId);
  }

  @Post('work-centers')
  createWorkCenter(@Request() req: any, @Body() body: any) {
    return this.svc.createWorkCenter(req.user.organizationId, body);
  }

  @Put('work-centers/:id')
  updateWorkCenter(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateWorkCenter(req.user.organizationId, id, body);
  }

  // BOM
  @Get('boms')
  findBOMs(@Request() req: any, @Query() q: any) {
    return this.svc.findBOMs(req.user.organizationId, { productId: q.productId, status: q.status });
  }

  @Get('boms/:id')
  findBOM(@Request() req: any, @Param('id') id: string) {
    return this.svc.findBOM(req.user.organizationId, id);
  }

  @Post('boms')
  createBOM(@Request() req: any, @Body() body: any) {
    return this.svc.createBOM(req.user.organizationId, body);
  }

  @Put('boms/:id')
  updateBOM(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateBOM(req.user.organizationId, id, body);
  }

  @Delete('boms/:id')
  deleteBOM(@Request() req: any, @Param('id') id: string) {
    return this.svc.deleteBOM(req.user.organizationId, id);
  }

  // Production Orders
  @Get('orders')
  findOrders(@Request() req: any, @Query() q: any) {
    return this.svc.findOrders(req.user.organizationId, {
      status: q.status,
      limit: q.limit ? +q.limit : undefined,
      offset: q.offset ? +q.offset : undefined,
    });
  }

  @Get('orders/:id')
  findOrder(@Request() req: any, @Param('id') id: string) {
    return this.svc.findOrder(req.user.organizationId, id);
  }

  @Post('orders')
  createOrder(@Request() req: any, @Body() body: any) {
    return this.svc.createOrder(req.user.organizationId, req.user.id, body);
  }

  @Put('orders/:id')
  updateOrder(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateOrder(req.user.organizationId, id, body);
  }

  @Post('orders/:id/record-production')
  recordProduction(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.recordProduction(req.user.organizationId, id, body.producedQty, body.scrapQty);
  }

  @Put('orders/:orderId/operations/:opId')
  updateOperation(@Request() req: any, @Param('orderId') orderId: string, @Param('opId') opId: string, @Body() body: any) {
    return this.svc.updateOperation(req.user.organizationId, orderId, opId, body);
  }
}
