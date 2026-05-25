import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Bildirimleri listele' })
  findAll(
    @CurrentUser() user: { id: string; organizationId: string },
    @Query('unread') unread?: string
  ) {
    return this.notificationsService.findAll(user.id, user.organizationId, unread === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Okunmamış bildirim sayısı' })
  getUnreadCount(@CurrentUser() user: { id: string; organizationId: string }) {
    return this.notificationsService.getUnreadCount(user.id, user.organizationId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Bildirimi okundu işaretle' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tüm bildirimleri okundu işaretle' })
  markAllAsRead(@CurrentUser() user: { id: string; organizationId: string }) {
    return this.notificationsService.markAllAsRead(user.id, user.organizationId);
  }
}
