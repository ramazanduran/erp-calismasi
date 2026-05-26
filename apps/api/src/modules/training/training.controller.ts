import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrainingService } from './training.service';

@ApiTags('training')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/training')
export class TrainingController {
  constructor(private svc: TrainingService) {}

  @Get('stats')
  stats(@Request() req: any) {
    return this.svc.getStats(req.user.organizationId);
  }

  @Get('programs')
  findPrograms(@Request() req: any, @Query() q: any) {
    return this.svc.findPrograms(req.user.organizationId, {
      category: q.category,
      isActive: q.isActive !== undefined ? q.isActive === 'true' : undefined,
    });
  }

  @Get('programs/:id')
  findProgram(@Request() req: any, @Param('id') id: string) {
    return this.svc.findProgram(req.user.organizationId, id);
  }

  @Post('programs')
  createProgram(@Request() req: any, @Body() body: any) {
    return this.svc.createProgram(req.user.organizationId, req.user.id, body);
  }

  @Put('programs/:id')
  updateProgram(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateProgram(req.user.organizationId, id, body);
  }

  @Delete('programs/:id')
  deleteProgram(@Request() req: any, @Param('id') id: string) {
    return this.svc.deleteProgram(req.user.organizationId, id);
  }

  @Post('programs/:programId/sessions')
  createSession(@Request() req: any, @Param('programId') programId: string, @Body() body: any) {
    return this.svc.createSession(req.user.organizationId, programId, body);
  }

  @Put('sessions/:sessionId')
  updateSession(@Request() req: any, @Param('sessionId') sessionId: string, @Body() body: any) {
    return this.svc.updateSession(req.user.organizationId, sessionId, body);
  }

  @Post('programs/:programId/enroll/:employeeId')
  enroll(@Request() req: any, @Param('programId') programId: string, @Param('employeeId') employeeId: string, @Body() body: any) {
    return this.svc.enrollEmployee(req.user.organizationId, programId, employeeId, body?.sessionId);
  }

  @Put('enrollments/:id')
  updateEnrollment(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateEnrollment(req.user.organizationId, id, body);
  }
}
