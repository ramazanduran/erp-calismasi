import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomersController, OrdersController, InvoicesController, QuotesController],
  providers: [CustomersService, OrdersService, InvoicesService, PdfService, QuotesService],
  exports: [CustomersService, OrdersService, InvoicesService, PdfService, QuotesService],
})
export class SalesModule {}
