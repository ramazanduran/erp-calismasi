import {
  Controller, Get, Post,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MovementsService } from './movements.service';

@ApiTags('inventory/movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/movements')
export class MovementsController {
  constructor(private movementsService: MovementsService) {}

  @Get()
  @ApiOperation({ summary: 'Stok hareketleri listesi' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; productId?: string; type?: string },
  ) {
    return this.movementsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Stok hareketi detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.movementsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Stok hareketi oluştur' })
  create(
    @Body() body: {
      productId: string;
      type: 'in' | 'out' | 'adjustment' | 'transfer';
      quantity: number;
      unitCost?: number;
      reference?: string;
      notes?: string;
    },
    @CurrentUser() user: { organizationId: string; id: string },
  ) {
    return this.movementsService.createMovement(user.organizationId, user.id, body);
  }
}
