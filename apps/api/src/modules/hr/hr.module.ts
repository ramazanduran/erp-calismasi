import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [DatabaseModule],
  controllers: [EmployeesController, LeavesController],
  providers: [EmployeesService, LeavesService],
  exports: [EmployeesService, LeavesService],
})
export class HrModule {}
