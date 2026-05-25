import { Module } from '@nestjs/common';
import { ErpGateway } from './erp.gateway';

@Module({
  providers: [ErpGateway],
  exports: [ErpGateway],
})
export class WebsocketModule {}
