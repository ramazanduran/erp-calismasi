import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsString()
  @IsNotEmpty({ message: 'Ürün seçiniz' })
  productId: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1, { message: 'Miktar en az 1 olmalıdır' })
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0, { message: 'Birim fiyat 0 veya daha büyük olmalıdır' })
  @Type(() => Number)
  unitPrice: number;

  @ApiProperty({ required: false, example: 10, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100, { message: 'İskonto oranı 0-100 arasında olmalıdır' })
  @Type(() => Number)
  discountRate?: number;
}
