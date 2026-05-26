import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountsController, TransactionsController, ReportsController],
  providers: [AccountsService, TransactionsService, ReportsService],
  exports: [AccountsService, TransactionsService, ReportsService],
})
export class FinanceModule {}
