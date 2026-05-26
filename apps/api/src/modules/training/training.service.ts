import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  // ─── Programs ──────────────────────────────────────────────────────────────

  async findPrograms(organizationId: string, params: { category?: string; isActive?: boolean }) {
    const where: any = { organizationId };
    if (params.category) where.category = params.category;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return this.prisma.trainingProgram.findMany({
      where,
      include: {
        _count: { select: { sessions: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProgram(organizationId: string, id: string) {
    const program = await this.prisma.trainingProgram.findFirst({
      where: { id, organizationId },
      include: {
        sessions: {
          include: {
            trainer: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { enrollments: true } },
          },
          orderBy: { startDate: 'asc' },
        },
        enrollments: {
          include: { employee: { select: { id: true, firstName: true, lastName: true, position: true } } },
        },
        _count: { select: { sessions: true, enrollments: true } },
      },
    });
    if (!program) throw new NotFoundException('Eğitim programı bulunamadı');
    return program;
  }

  async createProgram(organizationId: string, userId: string, data: any) {
    return this.prisma.trainingProgram.create({
      data: { ...data, organizationId, createdById: userId },
    });
  }

  async updateProgram(organizationId: string, id: string, data: any) {
    await this.findProgram(organizationId, id);
    return this.prisma.trainingProgram.update({ where: { id }, data });
  }

  async deleteProgram(organizationId: string, id: string) {
    await this.findProgram(organizationId, id);
    await this.prisma.trainingProgram.delete({ where: { id } });
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  async createSession(organizationId: string, programId: string, data: any) {
    await this.findProgram(organizationId, programId);
    return this.prisma.trainingSession.create({ data: { ...data, programId } });
  }

  async updateSession(organizationId: string, sessionId: string, data: any) {
    return this.prisma.trainingSession.update({ where: { id: sessionId }, data });
  }

  // ─── Enrollments ───────────────────────────────────────────────────────────

  async enrollEmployee(organizationId: string, programId: string, employeeId: string, sessionId?: string) {
    await this.findProgram(organizationId, programId);
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    const existing = await this.prisma.trainingEnrollment.findUnique({
      where: { programId_employeeId: { programId, employeeId } },
    });
    if (existing) throw new ConflictException('Personel bu programa zaten kayıtlı');

    return this.prisma.trainingEnrollment.create({
      data: { programId, employeeId, sessionId: sessionId || undefined },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async updateEnrollment(organizationId: string, enrollmentId: string, data: any) {
    const enrollment = await this.prisma.trainingEnrollment.findFirst({
      where: { id: enrollmentId, program: { organizationId } },
    });
    if (!enrollment) throw new NotFoundException('Kayıt bulunamadı');
    const updateData: any = { ...data };
    if (data.status === 'completed' && !enrollment.completedAt) updateData.completedAt = new Date();
    return this.prisma.trainingEnrollment.update({ where: { id: enrollmentId }, data: updateData });
  }

  async getStats(organizationId: string) {
    const [totalPrograms, activePrograms, totalEnrollments, completedEnrollments, byCategory] = await Promise.all([
      this.prisma.trainingProgram.count({ where: { organizationId } }),
      this.prisma.trainingProgram.count({ where: { organizationId, isActive: true } }),
      this.prisma.trainingEnrollment.count({ where: { program: { organizationId } } }),
      this.prisma.trainingEnrollment.count({ where: { program: { organizationId }, status: 'completed' } }),
      this.prisma.trainingProgram.groupBy({
        by: ['category'],
        where: { organizationId },
        _count: { _all: true },
      }),
    ]);

    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    return {
      totalPrograms,
      activePrograms,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      byCategory: Object.fromEntries(byCategory.map((c) => [c.category ?? 'other', c._count._all])),
    };
  }
}
