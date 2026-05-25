import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  UNPAID = 'unpaid',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class CreateLeaveDto {
  @ApiProperty({ example: 'employee-uuid-here' })
  @IsString()
  @IsNotEmpty({ message: 'Çalışan seçiniz' })
  employeeId: string;

  @ApiProperty({ enum: LeaveType })
  @IsEnum(LeaveType, { message: 'Geçerli bir izin tipi seçiniz' })
  type: LeaveType;

  @ApiProperty({ example: '2024-04-08' })
  @IsDateString({}, { message: 'Geçerli bir başlangıç tarihi giriniz' })
  startDate: string;

  @ApiProperty({ example: '2024-04-12' })
  @IsDateString({}, { message: 'Geçerli bir bitiş tarihi giriniz' })
  endDate: string;

  @ApiProperty({ required: false, example: 'Yıllık tatil' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ enum: LeaveStatus, required: false, default: LeaveStatus.PENDING })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;
}
