import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomersService } from './customers.service';

@ApiTags('sales/customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Müşteri listesi' })
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query() query: { page?: number; limit?: number; search?: string; status?: string; type?: string },
  ) {
    return this.customersService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Müşteri detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.customersService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Müşteri oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.customersService.create(user.organizationId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Müşteri güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.customersService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Müşteri sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.customersService.remove(id, user.organizationId);
  }
}
