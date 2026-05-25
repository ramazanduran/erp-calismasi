import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class FilesService {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {
    this.bucket = config.get<string>('MINIO_BUCKET', 'erp-files');
    this.minioClient = new Minio.Client({
      endPoint: config.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: config.get<number>('MINIO_PORT', 9000),
      useSSL: config.get<boolean>('MINIO_USE_SSL', false),
      accessKey: config.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: config.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
    this.ensureBucket();
  }

  private async ensureBucket() {
    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async upload(
    file: Express.Multer.File,
    organizationId: string,
    uploadedById: string,
    entityType?: string,
    entityId?: string
  ) {
    const ext = path.extname(file.originalname);
    const objectKey = `${organizationId}/${uuidv4()}${ext}`;

    await this.minioClient.putObject(
      this.bucket,
      objectKey,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    const record = await this.prisma.file.create({
      data: {
        organizationId,
        uploadedById,
        filename: objectKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        bucketName: this.bucket,
        objectKey,
        entityType,
        entityId,
      },
    });

    return {
      id: record.id,
      filename: record.filename,
      originalName: record.originalName,
      mimeType: record.mimeType,
      size: Number(record.size),
      url: `/api/v1/files/${record.id}`,
      uploadedAt: record.createdAt,
    };
  }

  async getSignedUrl(fileId: string, organizationId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, organizationId },
    });
    if (!file) throw new Error('Dosya bulunamadı');
    const url = await this.minioClient.presignedGetObject(this.bucket, file.objectKey, 3600);
    return { url };
  }

  async delete(fileId: string, organizationId: string) {
    const file = await this.prisma.file.findFirst({ where: { id: fileId, organizationId } });
    if (!file) throw new Error('Dosya bulunamadı');
    await this.minioClient.removeObject(this.bucket, file.objectKey);
    return this.prisma.file.delete({ where: { id: fileId } });
  }
}
