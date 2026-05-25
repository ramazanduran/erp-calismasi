import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PayrollService } from './payroll.service';

@Controller('api/v1/hr/payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private payroll: PayrollService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.payroll.findAll(user.org, query);
  }

  @Post('generate')
  generate(@CurrentUser() user: any, @Body() body: { period: string }) {
    return this.payroll.generatePeriod(user.org, user.sub, body.period);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payroll.approve(id, user.org);
  }

  @Patch(':id/paid')
  markPaid(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payroll.markPaid(id, user.org);
  }

  @Post('bulk-approve')
  bulkApprove(@CurrentUser() user: any, @Body() body: { period: string }) {
    return this.payroll.bulkApprove(body.period, user.org);
  }
}
