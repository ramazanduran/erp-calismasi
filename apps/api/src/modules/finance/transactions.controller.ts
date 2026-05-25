import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';

@ApiTags('finance/transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'İşlem listesi' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; accountId?: string; type?: string },
  ) {
    return this.transactionsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'İşlem detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.transactionsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'İşlem oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.transactionsService.create(user.organizationId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'İşlem güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.transactionsService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'İşlem sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.transactionsService.remove(id, user.organizationId);
  }
}
