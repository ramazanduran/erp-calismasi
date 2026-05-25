import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PricingController } from './pricing.controller';
import { PriceListsService } from './price-lists.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PricingController],
  providers: [PriceListsService],
  exports: [PriceListsService],
})
export class PricingModule {}
