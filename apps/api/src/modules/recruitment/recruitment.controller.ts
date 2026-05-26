import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecruitmentService } from './recruitment.service';

@ApiTags('recruitment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/recruitment')
export class RecruitmentController {
  constructor(private svc: RecruitmentService) {}

  @Get('stats')
  stats(@Request() req: any) {
    return this.svc.getStats(req.user.organizationId);
  }

  // Job Postings
  @Get('postings')
  findPostings(@Request() req: any, @Query() q: any) {
    return this.svc.findPostings(req.user.organizationId, { status: q.status, departmentId: q.departmentId });
  }

  @Get('postings/:id')
  findPosting(@Request() req: any, @Param('id') id: string) {
    return this.svc.findPosting(req.user.organizationId, id);
  }

  @Get('postings/:id/pipeline')
  getPipeline(@Request() req: any, @Param('id') id: string) {
    return this.svc.getPipeline(req.user.organizationId, id);
  }

  @Post('postings')
  createPosting(@Request() req: any, @Body() body: any) {
    return this.svc.createPosting(req.user.organizationId, req.user.id, body);
  }

  @Put('postings/:id')
  updatePosting(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updatePosting(req.user.organizationId, id, body);
  }

  @Delete('postings/:id')
  deletePosting(@Request() req: any, @Param('id') id: string) {
    return this.svc.deletePosting(req.user.organizationId, id);
  }

  // Candidates
  @Get('candidates')
  findCandidates(@Request() req: any, @Query() q: any) {
    return this.svc.findCandidates(req.user.organizationId, { search: q.search });
  }

  @Post('candidates')
  createCandidate(@Request() req: any, @Body() body: any) {
    return this.svc.createCandidate(req.user.organizationId, body);
  }

  @Put('candidates/:id')
  updateCandidate(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateCandidate(req.user.organizationId, id, body);
  }

  // Applications
  @Post('postings/:postingId/apply/:candidateId')
  apply(@Request() req: any, @Param('postingId') postingId: string, @Param('candidateId') candidateId: string, @Body() body: any) {
    return this.svc.applyCandidate(req.user.organizationId, postingId, candidateId, body);
  }

  @Put('applications/:appId')
  updateApplication(@Request() req: any, @Param('appId') appId: string, @Body() body: any) {
    return this.svc.updateApplication(req.user.organizationId, appId, body);
  }
}
