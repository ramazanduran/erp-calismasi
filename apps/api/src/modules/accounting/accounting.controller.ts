import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { JournalEntriesService } from './journal-entries.service';

@Controller('api/v1/accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(
    private coa: ChartOfAccountsService,
    private journal: JournalEntriesService,
  ) {}

  @Get('accounts')
  getAccounts(@CurrentUser() user: any) {
    return this.coa.findAll(user.org);
  }

  @Post('accounts')
  createAccount(@CurrentUser() user: any, @Body() body: any) {
    return this.coa.create(user.org, body);
  }

  @Patch('accounts/:id')
  updateAccount(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.coa.update(id, user.org, body);
  }

  @Get('accounts/:id/balance')
  getBalance(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coa.getAccountBalance(id, user.org);
  }

  @Get('journal')
  getJournal(@CurrentUser() user: any, @Query() query: any) {
    return this.journal.findAll(user.org, query);
  }

  @Post('journal')
  createEntry(@CurrentUser() user: any, @Body() body: any) {
    return this.journal.create(user.org, user.sub, body);
  }

  @Post('journal/:id/post')
  postEntry(@Param('id') id: string, @CurrentUser() user: any) {
    return this.journal.post(id, user.org);
  }

  @Get('trial-balance')
  getTrialBalance(@CurrentUser() user: any) {
    return this.journal.getTrialBalance(user.org);
  }
}
