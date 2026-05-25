import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkflowsService } from './workflows.service';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Get()
  @ApiOperation({ summary: 'İş akışlarını listele' })
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.workflowsService.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'İş akışı detayı' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.workflowsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'İş akışı oluştur' })
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() body: Record<string, unknown>
  ) {
    return this.workflowsService.create(user.organizationId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'İş akışı güncelle' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.workflowsService.update(id, user.organizationId, body);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'İş akışı aktif/pasif' })
  toggle(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.workflowsService.toggle(id, user.organizationId);
  }

  @Get(':id/instances')
  @ApiOperation({ summary: 'İş akışı çalışma geçmişi' })
  getInstances(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.workflowsService.getInstances(id, user.organizationId);
  }
}
