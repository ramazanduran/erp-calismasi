import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuotesService } from './quotes.service';

@Controller('api/v1/quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private service: QuotesService) {}

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

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { status: string }) {
    return this.service.updateStatus(id, user.org, body.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.org);
  }
}
