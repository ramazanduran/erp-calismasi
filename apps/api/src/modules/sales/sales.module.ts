import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomersController, OrdersController, InvoicesController],
  providers: [CustomersService, OrdersService, InvoicesService],
  exports: [CustomersService, OrdersService, InvoicesService],
})
export class SalesModule {}
