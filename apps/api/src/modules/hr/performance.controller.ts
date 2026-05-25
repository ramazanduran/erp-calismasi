import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PerformanceService } from './performance.service';

@Controller('api/v1/hr/performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private performance: PerformanceService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.performance.findAll(user.org, query);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.performance.create(user.org, user.sub, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.performance.update(id, user.org, body);
  }
}
