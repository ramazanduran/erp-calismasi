import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ErpGateway } from './erp.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'secret'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ErpGateway],
  exports: [ErpGateway],
})
export class WebsocketModule {}
