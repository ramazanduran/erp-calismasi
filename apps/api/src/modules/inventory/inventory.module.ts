import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController, CategoriesController, MovementsController],
  providers: [ProductsService, CategoriesService, MovementsService],
  exports: [ProductsService, CategoriesService, MovementsService],
})
export class InventoryModule {}
