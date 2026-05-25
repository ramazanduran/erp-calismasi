import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [DatabaseModule],
  controllers: [EmployeesController, LeavesController, PerformanceController, PayrollController],
  providers: [EmployeesService, LeavesService, PerformanceService, PayrollService],
  exports: [EmployeesService, LeavesService, PerformanceService, PayrollService],
})
export class HrModule {}
