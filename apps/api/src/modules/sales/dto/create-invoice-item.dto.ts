import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Yazılım geliştirme hizmeti' })
  @IsString()
  @IsNotEmpty({ message: 'Açıklama gereklidir' })
  description: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1, { message: 'Miktar en az 1 olmalıdır' })
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiProperty({ required: false, example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxRate?: number;

  @ApiProperty({ required: false, example: 'product-uuid' })
  @IsOptional()
  @IsString()
  productId?: string;
}
