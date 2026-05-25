import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
}

export class CreateMovementDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsString()
  @IsNotEmpty({ message: 'Ürün seçiniz' })
  productId: string;

  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType, { message: 'Geçerli bir hareket tipi seçiniz' })
  type: MovementType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1, { message: 'Miktar en az 1 olmalıdır' })
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ required: false, example: 20000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost?: number;

  @ApiProperty({ required: false, example: 'SAL-2024-001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: 'warehouse-uuid-here' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiProperty({ required: false, example: 'destination-warehouse-uuid' })
  @IsOptional()
  @IsString()
  destinationWarehouseId?: string;
}
