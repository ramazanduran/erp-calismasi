import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountsService } from './accounts.service';

@ApiTags('finance/accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Hesap listesi' })
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.accountsService.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Hesap detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.accountsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Hesap oluştur' })
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.accountsService.create(user.organizationId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Hesap güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.accountsService.update(id, user.organizationId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hesap sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.accountsService.remove(id, user.organizationId);
  }
}
