import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';

@ApiTags('sales/invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Fatura listesi' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; search?: string; status?: string; type?: string },
  ) {
    return this.invoicesService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fatura detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.invoicesService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Fatura oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string; id: string },
  ) {
    return this.invoicesService.create(user.organizationId, user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Fatura güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.invoicesService.update(id, user.organizationId, body);
  }

  @Patch(':id/send')
  @ApiOperation({ summary: 'Faturayı gönder' })
  send(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.invoicesService.send(id, user.organizationId);
  }

  @Patch(':id/mark-as-paid')
  @ApiOperation({ summary: 'Faturayı ödendi olarak işaretle' })
  markAsPaid(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.invoicesService.markAsPaid(id, user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Fatura sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.invoicesService.remove(id, user.organizationId);
  }
}
