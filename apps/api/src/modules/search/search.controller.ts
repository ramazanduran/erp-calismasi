import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global arama' })
  search(
    @Query('q') query: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.searchService.search(user.organizationId, query);
  }
}
