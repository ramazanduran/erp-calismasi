import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExchangeRatesService } from './exchange-rates.service';

@ApiTags('Exchange Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private service: ExchangeRatesService) {}

  @Get()
  @ApiOperation({ summary: 'Döviz kurları' })
  findAll(
    @Request() req: { user: { org: string } },
    @Query('baseCurrency') baseCurrency?: string,
    @Query('date') date?: string,
  ) {
    return this.service.findAll(req.user.org, { baseCurrency, date });
  }

  @Get('latest')
  @ApiOperation({ summary: 'Güncel kurlar' })
  getLatest(
    @Request() req: { user: { org: string } },
    @Query('baseCurrency') baseCurrency?: string,
  ) {
    return this.service.getLatest(req.user.org, baseCurrency);
  }

  @Get('convert')
  @ApiOperation({ summary: 'Para birimi dönüştür' })
  convert(
    @Request() req: { user: { org: string } },
    @Query('amount') amount: number,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('date') date?: string,
  ) {
    return this.service.convert(req.user.org, amount, from, to, date);
  }

  @Post()
  @ApiOperation({ summary: 'Kur ekle/güncelle' })
  upsert(
    @Request() req: { user: { org: string } },
    @Body() body: { baseCurrency: string; targetCurrency: string; rate: number; date: string; source?: string },
  ) {
    return this.service.upsertRate(req.user.org, body);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Toplu kur ekle' })
  bulkUpsert(
    @Request() req: { user: { org: string } },
    @Body() body: { rates: Array<{ baseCurrency: string; targetCurrency: string; rate: number; date: string; source?: string }> },
  ) {
    return this.service.bulkUpsert(req.user.org, body.rates);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kur sil' })
  delete(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.delete(id, req.user.org);
  }
}
