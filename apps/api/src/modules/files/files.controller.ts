import {
  Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors,
  UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilesService } from './files.service';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Dosya yükle' })
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|csv|txt|zip)$/i }),
        ],
      })
    )
    file: Express.Multer.File,
    @CurrentUser() user: { id: string; organizationId: string }
  ) {
    return this.filesService.upload(file, user.organizationId, user.id);
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Dosya URL\'si al' })
  getUrl(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string }
  ) {
    return this.filesService.getSignedUrl(id, user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Dosya sil' })
  delete(@Param('id') id: string, @CurrentUser() user: { organizationId: string }) {
    return this.filesService.delete(id, user.organizationId);
  }
}
