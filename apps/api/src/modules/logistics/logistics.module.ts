import { Module } from '@nestjs/common';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  controllers: [LogisticsController, VehiclesController],
  providers: [LogisticsService, VehiclesService],
  exports: [LogisticsService, VehiclesService],
})
export class LogisticsModule {}
