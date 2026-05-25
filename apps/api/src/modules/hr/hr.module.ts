import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';

@Module({
  imports: [DatabaseModule],
  controllers: [EmployeesController, LeavesController, PerformanceController],
  providers: [EmployeesService, LeavesService, PerformanceService],
  exports: [EmployeesService, LeavesService, PerformanceService],
})
export class HrModule {}
