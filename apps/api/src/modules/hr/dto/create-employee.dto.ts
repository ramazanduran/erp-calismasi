import {
  IsString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SalaryType {
  MONTHLY = 'monthly',
  HOURLY = 'hourly',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ahmet' })
  @IsString()
  @IsNotEmpty({ message: 'Ad gereklidir' })
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Yıldız' })
  @IsString()
  @IsNotEmpty({ message: 'Soyad gereklidir' })
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'ahmet.yildiz@sirket.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ required: false, example: '0532 111 2233' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'EMP-001' })
  @IsString()
  @IsNotEmpty({ message: 'Sicil numarası gereklidir' })
  @MaxLength(50)
  employeeNumber: string;

  @ApiProperty({ required: false, example: 'department-uuid-here' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ required: false, example: 'Kıdemli Yazılım Mühendisi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString({}, { message: 'Geçerli bir başlangıç tarihi giriniz' })
  startDate: string;

  @ApiProperty({ example: 55000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salary: number;

  @ApiProperty({ enum: SalaryType, default: SalaryType.MONTHLY })
  @IsEnum(SalaryType, { message: 'Geçerli bir maaş tipi seçiniz' })
  salaryType: SalaryType;

  @ApiProperty({ enum: EmployeeStatus, required: false, default: EmployeeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
