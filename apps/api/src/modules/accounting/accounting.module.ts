import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { JournalEntriesService } from './journal-entries.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountingController],
  providers: [ChartOfAccountsService, JournalEntriesService],
})
export class AccountingModule {}
