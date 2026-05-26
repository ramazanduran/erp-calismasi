import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private service: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'Webhook listesi' })
  findAll(@Request() req: { user: { org: string } }) {
    return this.service.findAll(req.user.org);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Webhook detayı' })
  findOne(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.org);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Webhook kayıtları' })
  getLogs(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.getLogs(id, req.user.org);
  }

  @Post()
  @ApiOperation({ summary: 'Webhook oluştur' })
  create(@Request() req: { user: { org: string } }, @Body() body: Record<string, unknown>) {
    return this.service.create(req.user.org, body);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Webhook test et' })
  test(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.test(id, req.user.org);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Webhook güncelle' })
  update(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, req.user.org, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Webhook sil' })
  delete(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.delete(id, req.user.org);
  }
}
