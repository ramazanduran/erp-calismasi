import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'URN-001' })
  @IsString()
  @IsNotEmpty({ message: 'Ürün kodu gereklidir' })
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Laptop Dell Inspiron 15' })
  @IsString()
  @IsNotEmpty({ message: 'Ürün adı gereklidir' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ required: false, example: 'category-uuid-here' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 'adet', default: 'adet' })
  @IsString()
  @IsNotEmpty({ message: 'Birim gereklidir' })
  @MaxLength(20)
  unit: string;

  @ApiProperty({ example: 20000.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchasePrice: number;

  @ApiProperty({ example: 25000.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;

  @ApiProperty({ example: 20, enum: [0, 8, 18, 20] })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  vatRate: number;

  @ApiProperty({ required: false, example: 5, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStock?: number;

  @ApiProperty({ required: false, example: '8695830001234' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
