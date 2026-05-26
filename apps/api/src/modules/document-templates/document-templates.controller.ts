import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentTemplatesService } from './document-templates.service';

@ApiTags('Document Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('document-templates')
export class DocumentTemplatesController {
  constructor(private service: DocumentTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Şablon listesi' })
  findAll(@Request() req: { user: { org: string } }, @Query('type') type?: string) {
    return this.service.findAll(req.user.org, type);
  }

  @Get('defaults')
  @ApiOperation({ summary: 'Varsayılan şablonlar' })
  getDefaults() {
    return this.service.getDefaultTemplates();
  }

  @Get('documents')
  @ApiOperation({ summary: 'Oluşturulan dokümanlar' })
  findDocuments(
    @Request() req: { user: { org: string } },
    @Query('templateId') templateId?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.service.findDocuments(req.user.org, { templateId, entityType });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Şablon detayı' })
  findOne(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.org);
  }

  @Post()
  @ApiOperation({ summary: 'Şablon oluştur' })
  create(@Request() req: { user: { org: string } }, @Body() body: Record<string, unknown>) {
    return this.service.create(req.user.org, body);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Doküman üret' })
  generate(
    @Request() req: { user: { org: string } },
    @Param('id') id: string,
    @Body() body: { name: string; variables: Record<string, string>; entityType?: string; entityId?: string },
  ) {
    return this.service.generateDocument(id, req.user.org, body);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Şablon önizleme' })
  preview(
    @Request() req: { user: { org: string } },
    @Param('id') id: string,
    @Body() body: { variables: Record<string, string> },
  ) {
    return this.service.previewTemplate(id, req.user.org, body.variables);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Şablon güncelle' })
  update(@Request() req: { user: { org: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, req.user.org, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Şablon sil' })
  delete(@Request() req: { user: { org: string } }, @Param('id') id: string) {
    return this.service.delete(id, req.user.org);
  }
}
