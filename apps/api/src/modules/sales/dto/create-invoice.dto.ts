import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export enum InvoiceType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  REFUND = 'refund',
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'customer-uuid-here' })
  @IsString()
  @IsNotEmpty({ message: 'Müşteri seçiniz' })
  customerId: string;

  @ApiProperty({ required: false, example: 'order-uuid-here' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ enum: InvoiceType, default: InvoiceType.SALE })
  @IsEnum(InvoiceType, { message: 'Geçerli bir fatura tipi seçiniz' })
  type: InvoiceType;

  @ApiProperty({ example: '2024-03-01' })
  @IsDateString({}, { message: 'Geçerli bir düzenlenme tarihi giriniz' })
  issueDate: string;

  @ApiProperty({ required: false, example: '2024-03-31' })
  @IsOptional()
  @IsDateString({}, { message: 'Geçerli bir vade tarihi giriniz' })
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'En az bir fatura kalemi ekleyiniz' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
