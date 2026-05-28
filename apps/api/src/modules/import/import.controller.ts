import { Controller, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImportService } from './import.service';

@Controller('api/v1/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('customers')
  @UseInterceptors(FileInterceptor('file'))
  importCustomers(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.importService.importCustomers(user.org, file.buffer);
  }

  @Post('products')
  @UseInterceptors(FileInterceptor('file'))
  importProducts(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.importService.importProducts(user.org, file.buffer);
  }

  @Post('employees')
  @UseInterceptors(FileInterceptor('file'))
  importEmployees(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.importService.importEmployees(user.org, file.buffer);
  }

  @Post('suppliers')
  @UseInterceptors(FileInterceptor('file'))
  importSuppliers(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.importService.importSuppliers(user.org, file.buffer);
  }

  @Post('inventory')
  @UseInterceptors(FileInterceptor('file'))
  importInventory(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.importService.importInventory(user.org, file.buffer);
  }
}
