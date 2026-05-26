import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@ApiTags('finance/reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/finance/reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('profit-loss')
  getProfitLoss(@CurrentUser() user: any, @Query('year') year?: string) {
    return this.service.getProfitLoss(user.org, year ? +year : new Date().getFullYear());
  }

  @Get('cash-flow')
  getCashFlow(@CurrentUser() user: any, @Query('year') year?: string) {
    return this.service.getCashFlow(user.org, year ? +year : new Date().getFullYear());
  }

  @Get('balance-sheet')
  getBalanceSheet(@CurrentUser() user: any) {
    return this.service.getBalanceSheet(user.org);
  }

  @Get('accounts-receivable')
  getAccountsReceivable(@CurrentUser() user: any) {
    return this.service.getAccountsReceivable(user.org);
  }
}
