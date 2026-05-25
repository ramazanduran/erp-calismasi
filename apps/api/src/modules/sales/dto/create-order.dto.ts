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
import { CreateOrderItemDto } from './create-order-item.dto';

export enum OrderType {
  SALE = 'sale',
  PURCHASE = 'purchase',
}

export class CreateOrderDto {
  @ApiProperty({ example: 'customer-uuid-here' })
  @IsString()
  @IsNotEmpty({ message: 'Müşteri seçiniz' })
  customerId: string;

  @ApiProperty({ enum: OrderType, default: OrderType.SALE })
  @IsEnum(OrderType, { message: 'Geçerli bir sipariş tipi seçiniz' })
  type: OrderType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: '2024-12-31' })
  @IsOptional()
  @IsDateString({}, { message: 'Geçerli bir tarih giriniz' })
  dueDate?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'En az bir sipariş kalemi ekleyiniz' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
