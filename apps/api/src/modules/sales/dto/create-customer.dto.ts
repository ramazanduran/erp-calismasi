import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  PASSIVE = 'passive',
  BLOCKED = 'blocked',
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'ABC Teknoloji A.Ş.' })
  @IsString()
  @IsNotEmpty({ message: 'Müşteri adı gereklidir' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ required: false, example: 'info@abc.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email?: string;

  @ApiProperty({ required: false, example: '0212 555 0101' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ enum: CustomerType, default: CustomerType.CORPORATE })
  @IsEnum(CustomerType, { message: 'Geçerli bir müşteri tipi seçiniz' })
  type: CustomerType;

  @ApiProperty({ required: false, example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxNumber?: string;

  @ApiProperty({ required: false, example: 'Kadıköy VD' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxOffice?: string;

  @ApiProperty({ required: false, example: 'İstanbul, Türkiye' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({ required: false, example: 50000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  creditLimit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ enum: CustomerStatus, required: false, default: CustomerStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
