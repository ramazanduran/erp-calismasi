import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { parse } from 'csv-parse/sync';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  private parseCSV(buffer: Buffer): Record<string, string>[] {
    return parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
  }

  async importCustomers(organizationId: string, buffer: Buffer) {
    const rows = this.parseCSV(buffer);
    let created = 0, updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existing = await this.prisma.customer.findFirst({
          where: { organizationId, code: row.code },
        });
        if (existing) {
          await this.prisma.customer.update({ where: { id: existing.id }, data: { name: row.name, email: row.email, phone: row.phone } as any });
          updated++;
        } else {
          await this.prisma.customer.create({ data: { organizationId, code: row.code, name: row.name, email: row.email, phone: row.phone, type: row.type || 'corporate' } as any });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    return { total: rows.length, created, updated, errors };
  }

  async importProducts(organizationId: string, buffer: Buffer) {
    const rows = this.parseCSV(buffer);
    let created = 0, updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existing = await this.prisma.product.findFirst({ where: { organizationId, code: row.code } });
        const data: any = { name: row.name, unit: row.unit || 'adet', salePrice: parseFloat(row.salePrice || '0'), purchasePrice: parseFloat(row.purchasePrice || '0'), vatRate: parseFloat(row.vatRate || '18') };
        if (existing) {
          await this.prisma.product.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await this.prisma.product.create({ data: { organizationId, code: row.code, ...data } });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    return { total: rows.length, created, updated, errors };
  }

  async importEmployees(organizationId: string, buffer: Buffer) {
    const rows = this.parseCSV(buffer);
    let created = 0, updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existing = await this.prisma.employee.findFirst({ where: { organizationId, employeeNumber: row.employeeNumber } });
        const data: any = { firstName: row.firstName, lastName: row.lastName, email: row.email, phone: row.phone, position: row.position };
        if (existing) {
          await this.prisma.employee.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await this.prisma.employee.create({ data: { organizationId, employeeNumber: row.employeeNumber, startDate: new Date(), ...data } as any });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    return { total: rows.length, created, updated, errors };
  }
}
