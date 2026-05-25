import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTokensService } from './api-tokens.service';

@ApiTags('API Tokens')
@ApiBearerAuth()
@Controller('api/v1/api-tokens')
@UseGuards(JwtAuthGuard)
export class ApiTokensController {
  constructor(private service: ApiTokensService) {}

  @Get()
  @ApiOperation({ summary: 'List API tokens for current user' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.org, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new API token' })
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.org, user.sub, body);
  }

  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API token' })
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.revoke(id, user.org, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API token' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.org, user.sub);
  }
}
