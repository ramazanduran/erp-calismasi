import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  // ─── Job Postings ──────────────────────────────────────────────────────────

  async findPostings(organizationId: string, params: { status?: string; departmentId?: string }) {
    const where: any = { organizationId };
    if (params.status) where.status = params.status;
    if (params.departmentId) where.departmentId = params.departmentId;

    return this.prisma.jobPosting.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPosting(organizationId: string, id: string) {
    const posting = await this.prisma.jobPosting.findFirst({
      where: { id, organizationId },
      include: {
        department: { select: { id: true, name: true } },
        applications: {
          include: { candidate: { select: { id: true, firstName: true, lastName: true, email: true, currentTitle: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!posting) throw new NotFoundException('İlan bulunamadı');
    return posting;
  }

  async createPosting(organizationId: string, userId: string, data: any) {
    return this.prisma.jobPosting.create({
      data: { ...data, organizationId, createdById: userId },
    });
  }

  async updatePosting(organizationId: string, id: string, data: any) {
    await this.findPosting(organizationId, id);
    return this.prisma.jobPosting.update({ where: { id }, data });
  }

  async deletePosting(organizationId: string, id: string) {
    await this.findPosting(organizationId, id);
    await this.prisma.jobPosting.delete({ where: { id } });
  }

  async getPipeline(organizationId: string, postingId: string) {
    const applications = await this.prisma.jobApplication.findMany({
      where: { postingId, posting: { organizationId } },
      include: {
        candidate: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const stages = ['applied', 'screening', 'interview', 'technical', 'offer', 'hired', 'rejected'];
    const pipeline: Record<string, any[]> = {};
    for (const stage of stages) pipeline[stage] = [];
    for (const app of applications) pipeline[app.stage]?.push(app);
    return pipeline;
  }

  // ─── Candidates ────────────────────────────────────────────────────────────

  async findCandidates(organizationId: string, params: { search?: string }) {
    const where: any = { organizationId };
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.candidate.findMany({
      where,
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCandidate(organizationId: string, data: any) {
    const existing = await this.prisma.candidate.findUnique({
      where: { organizationId_email: { organizationId, email: data.email } },
    });
    if (existing) throw new ConflictException('Bu e-posta ile aday zaten mevcut');
    return this.prisma.candidate.create({ data: { ...data, organizationId } });
  }

  async updateCandidate(organizationId: string, id: string, data: any) {
    const candidate = await this.prisma.candidate.findFirst({ where: { id, organizationId } });
    if (!candidate) throw new NotFoundException('Aday bulunamadı');
    return this.prisma.candidate.update({ where: { id }, data });
  }

  // ─── Applications ──────────────────────────────────────────────────────────

  async applyCandidate(organizationId: string, postingId: string, candidateId: string, data: any = {}) {
    await this.findPosting(organizationId, postingId);
    const candidate = await this.prisma.candidate.findFirst({ where: { id: candidateId, organizationId } });
    if (!candidate) throw new NotFoundException('Aday bulunamadı');
    return this.prisma.jobApplication.create({ data: { postingId, candidateId, ...data } });
  }

  async updateApplication(organizationId: string, appId: string, data: any) {
    const app = await this.prisma.jobApplication.findFirst({
      where: { id: appId, posting: { organizationId } },
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı');
    const updateData: any = { ...data };
    if (data.stage === 'hired' && !app.hiredAt) updateData.hiredAt = new Date();
    return this.prisma.jobApplication.update({ where: { id: appId }, data: updateData });
  }

  async getStats(organizationId: string) {
    const [totalPostings, openPostings, totalCandidates, totalApplications, byStage] = await Promise.all([
      this.prisma.jobPosting.count({ where: { organizationId } }),
      this.prisma.jobPosting.count({ where: { organizationId, status: 'open' } }),
      this.prisma.candidate.count({ where: { organizationId } }),
      this.prisma.jobApplication.count({ where: { posting: { organizationId } } }),
      this.prisma.jobApplication.groupBy({
        by: ['stage'],
        where: { posting: { organizationId } },
        _count: { _all: true },
      }),
    ]);

    const hired = byStage.find((s) => s.stage === 'hired')?._count._all ?? 0;
    const conversionRate = totalApplications > 0 ? Math.round((hired / totalApplications) * 100) : 0;

    return {
      totalPostings,
      openPostings,
      totalCandidates,
      totalApplications,
      hired,
      conversionRate,
      byStage: Object.fromEntries(byStage.map((s) => [s.stage, s._count._all])),
    };
  }
}
