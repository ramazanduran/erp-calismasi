import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Türkiye bordro hesaplama (2024)
function calculatePayroll(grossSalary: number): {
  sgkEmployee: number;
  sgkEmployer: number;
  incomeTax: number;
  stampTax: number;
  netSalary: number;
} {
  // SGK işçi payı: %14
  const sgkEmployee = Math.round(grossSalary * 0.14 * 100) / 100;
  // SGK işveren payı: %20.5
  const sgkEmployer = Math.round(grossSalary * 0.205 * 100) / 100;
  // Gelir vergisi matrahı
  const taxBase = grossSalary - sgkEmployee;
  // Gelir vergisi (basit dilim: %15 ilk 110.000, %20 sonrası - 2024 asgari ücret istisnası dahil değil)
  let incomeTax = 0;
  if (taxBase <= 110000 / 12) incomeTax = taxBase * 0.15;
  else incomeTax = (110000 / 12) * 0.15 + (taxBase - 110000 / 12) * 0.20;
  incomeTax = Math.round(incomeTax * 100) / 100;
  // Damga vergisi: %0.759
  const stampTax = Math.round(grossSalary * 0.00759 * 100) / 100;
  const netSalary = Math.round((grossSalary - sgkEmployee - incomeTax - stampTax) * 100) / 100;
  return { sgkEmployee, sgkEmployer, incomeTax, stampTax, netSalary };
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, params: { period?: string; status?: string } = {}) {
    return this.prisma.payroll.findMany({
      where: { organizationId, period: params.period, status: params.status },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async generatePeriod(organizationId: string, userId: string, period: string) {
    // O döneme ait çalışanlar için bordro oluştur
    const employees = await this.prisma.employee.findMany({
      where: { organizationId, status: 'active' },
    });

    const results = [];
    for (const emp of employees) {
      const existing = await this.prisma.payroll.findUnique({
        where: { organizationId_employeeId_period: { organizationId, employeeId: emp.id, period } },
      });
      if (existing) continue;

      const gross = Number(emp.salary);
      const calculated = calculatePayroll(gross);
      const payroll = await this.prisma.payroll.create({
        data: {
          organizationId,
          employeeId: emp.id,
          period,
          grossSalary: gross,
          ...calculated,
          createdById: userId,
        },
      });
      results.push(payroll);
    }
    return { created: results.length, period };
  }

  async approve(id: string, organizationId: string) {
    return this.prisma.payroll.updateMany({ where: { id, organizationId }, data: { status: 'approved' } });
  }

  async markPaid(id: string, organizationId: string) {
    return this.prisma.payroll.updateMany({ where: { id, organizationId }, data: { status: 'paid', paidAt: new Date() } });
  }

  async bulkApprove(period: string, organizationId: string) {
    return this.prisma.payroll.updateMany({ where: { organizationId, period, status: 'draft' }, data: { status: 'approved' } });
  }
}
