import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountsController, TransactionsController],
  providers: [AccountsService, TransactionsService],
  exports: [AccountsService, TransactionsService],
})
export class FinanceModule {}
