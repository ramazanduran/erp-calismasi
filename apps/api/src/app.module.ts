import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RolesModule } from './modules/roles/roles.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FilesModule } from './modules/files/files.module';
import { AuditModule } from './modules/audit/audit.module';
import { SearchModule } from './modules/search/search.module';
import { WebsocketModule } from './websocket/websocket.module';
import { SalesModule } from './modules/sales/sales.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DepartmentsModule } from './modules/departments/departments.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 500 },
    ]),

    // Scheduler
    ScheduleModule.forRoot(),

    // Queue (BullMQ)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      }),
      inject: [ConfigService],
    }),

    // Core modules
    DatabaseModule,
    WebsocketModule,

    // Business modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RolesModule,
    EntitiesModule,
    WorkflowsModule,
    NotificationsModule,
    FilesModule,
    AuditModule,
    SearchModule,

    // Business modules - Faz 2
    SalesModule,
    InventoryModule,
    FinanceModule,
    HrModule,

    // Analytics - Faz 4
    AnalyticsModule,

    // Departments - Faz 5
    DepartmentsModule,
  ],
})
export class AppModule {}
