import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';
import { StockCountController } from './stock-count.controller';
import { StockCountService } from './stock-count.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController, CategoriesController, MovementsController, StockCountController],
  providers: [ProductsService, CategoriesService, MovementsService, StockCountService],
  exports: [ProductsService, CategoriesService, MovementsService, StockCountService],
})
export class InventoryModule {}
