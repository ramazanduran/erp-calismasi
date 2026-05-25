import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { winstonConfig } from './common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT', 4000);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  // Security
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Slug'],
  });

  // Global prefix & versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ERP System API')
      .setDescription('Evrensel ERP Sistemi REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Kimlik doğrulama')
      .addTag('Users', 'Kullanıcı yönetimi')
      .addTag('Organizations', 'Organizasyon yönetimi')
      .addTag('Sales', 'Satış modülü')
      .addTag('Inventory', 'Stok modülü')
      .addTag('Finance', 'Finans modülü')
      .addTag('HR', 'İnsan kaynakları')
      .addTag('Purchasing', 'Satın alma')
      .addTag('Accounting', 'Muhasebe')
      .addTag('Tasks', 'Görev yönetimi')
      .addTag('Analytics', 'Analitik')
      .addTag('Health', 'Sistem sağlığı')
      .addTag('CRM', 'Müşteri ilişkileri')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`🚀 ERP API running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
