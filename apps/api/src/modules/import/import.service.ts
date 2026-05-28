import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  private parseFile(buffer: Buffer): Record<string, string>[] {
    // Detect xlsx by magic bytes (PK zip header)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
    }
    return parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
  }

  async importCustomers(organizationId: string, buffer: Buffer) {
    const rows = this.parseFile(buffer);
    let created = 0, updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existing = await this.prisma.customer.findFirst({
          where: { organizationId, code: row.code },
        });
        if (existing) {
          await this.prisma.customer.update({
            where: { id: existing.id },
            data: { name: row.name, email: row.email || undefined, phone: row.phone || undefined } as any,
          });
          updated++;
        } else {
          await this.prisma.customer.create({
            data: {
              organizationId,
              code: row.code,
              name: row.name,
              email: row.email || undefined,
              phone: row.phone || undefined,
              type: row.type || 'corporate',
              taxNumber: row.taxNumber || undefined,
              taxOffice: row.taxOffice || undefined,
              address: row.address || undefined,
            } as any,
          });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    return { total: rows.length, created, updated, errors };
  }

  async importProducts(organizationId: string, buffer: Buffer) {
    const rows = this.parseFile(buffer);
    let created = 0, updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existing = await this.prisma.product.findFirst({ where: { organizationId, code: row.code } });
        const data: any = {
          name: row.name,
          unit: row.unit || 'adet',
          salePrice: parseFloat(String(row.salePrice || '0')),
          purchasePrice: parseFloat(String(row.purchasePrice || '0')),
          vatRate: parseFloat(String(row.vatRate || '18')),
          barcode: row.barcode || undefined,
          minStock: parseFloat(String(row.minStock || '0')),
        };
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
    const rows = this.parseFile(buffer);
    let created = 0, updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existing = await this.prisma.employee.findFirst({ where: { organizationId, employeeNumber: row.employeeNumber } });
        const data: any = {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || undefined,
          phone: row.phone || undefined,
          position: row.position || undefined,
          baseSalary: row.baseSalary ? parseFloat(String(row.baseSalary)) : undefined,
        };
        if (existing) {
          await this.prisma.employee.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          const hireDate = row.hireDate ? new Date(row.hireDate) : new Date();
          await this.prisma.employee.create({
            data: { organizationId, employeeNumber: row.employeeNumber, startDate: hireDate, ...data } as any,
          });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    return { total: rows.length, created, updated, errors };
  }

  async importSuppliers(organizationId: string, buffer: Buffer) {
    const rows = this.parseFile(buffer);
    let created = 0, updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existing = await this.prisma.supplier.findFirst({ where: { organizationId, code: row.code } });
        const data: any = {
          name: row.name,
          email: row.email || undefined,
          phone: row.phone || undefined,
          taxNumber: row.taxNumber || undefined,
          paymentTerms: row.paymentTerms ? parseInt(String(row.paymentTerms)) : undefined,
          address: row.address || undefined,
        };
        if (existing) {
          await this.prisma.supplier.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await this.prisma.supplier.create({ data: { organizationId, code: row.code, ...data } as any });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    return { total: rows.length, created, updated, errors };
  }

  async importInventory(organizationId: string, buffer: Buffer) {
    const rows = this.parseFile(buffer);
    let created = 0, updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const product = await this.prisma.product.findFirst({ where: { organizationId, code: row.productCode } });
        if (!product) throw new Error(`Ürün bulunamadı: ${row.productCode}`);

        const warehouse = await (this.prisma as any).warehouse?.findFirst({ where: { organizationId, code: row.warehouseCode } });

        const existing = await (this.prisma as any).stockItem?.findFirst({
          where: { productId: product.id, ...(warehouse ? { warehouseId: warehouse.id } : {}) },
        });

        const qty = parseFloat(String(row.quantity || '0'));
        const cost = parseFloat(String(row.unitCost || '0'));

        if (existing) {
          await (this.prisma as any).stockItem?.update({ where: { id: existing.id }, data: { quantity: qty, unitCost: cost } });
          updated++;
        } else {
          await (this.prisma as any).stockItem?.create({
            data: {
              productId: product.id,
              warehouseId: warehouse?.id,
              quantity: qty,
              unitCost: cost,
            },
          });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    return { total: rows.length, created, updated, errors };
  }
}
