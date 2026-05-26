import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BankReconciliationService } from './bank-reconciliation.service';

@ApiTags('bank-reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/bank-reconciliation')
export class BankReconciliationController {
  constructor(private svc: BankReconciliationService) {}

  @Get()
  findStatements(@Request() req: any, @Query('accountId') accountId?: string) {
    return this.svc.findStatements(req.user.organizationId, accountId);
  }

  @Get(':id')
  findStatement(@Request() req: any, @Param('id') id: string) {
    return this.svc.findStatement(req.user.organizationId, id);
  }

  @Get(':id/summary')
  getSummary(@Request() req: any, @Param('id') id: string) {
    return this.svc.getSummary(req.user.organizationId, id);
  }

  @Post()
  createStatement(@Request() req: any, @Body() body: any) {
    return this.svc.createStatement(req.user.organizationId, body);
  }

  @Post(':id/auto-match')
  autoMatch(@Request() req: any, @Param('id') id: string) {
    return this.svc.autoMatch(req.user.organizationId, id);
  }

  @Put(':id/lines/:lineId/match')
  matchLine(@Request() req: any, @Param('id') id: string, @Param('lineId') lineId: string, @Body() body: any) {
    return this.svc.matchLine(req.user.organizationId, id, lineId, body.transactionId);
  }

  @Put(':id/lines/:lineId/ignore')
  ignoreLine(@Request() req: any, @Param('id') id: string, @Param('lineId') lineId: string, @Body() body: any) {
    return this.svc.ignoreLine(req.user.organizationId, id, lineId, body.notes);
  }
}
