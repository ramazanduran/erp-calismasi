import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarService } from './calendar.service';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/calendar')
export class CalendarController {
  constructor(private svc: CalendarService) {}

  @Get('upcoming')
  upcoming(@Request() req: any, @Query('days') days: string) {
    return this.svc.getUpcoming(req.user.organizationId, req.user.id, days ? +days : 7);
  }

  @Get()
  findAll(@Request() req: any, @Query() q: any) {
    return this.svc.findEvents(req.user.organizationId, {
      from: q.from,
      to: q.to,
      type: q.type,
      userId: q.myEvents === 'true' ? req.user.id : undefined,
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.svc.findOne(req.user.organizationId, id);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.svc.create(req.user.organizationId, req.user.id, body);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.update(req.user.organizationId, id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.delete(req.user.organizationId, id);
  }

  @Put(':id/respond')
  respond(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.respondToInvite(req.user.organizationId, id, req.user.id, body.status);
  }
}
