import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async findEvents(organizationId: string, params: { from?: string; to?: string; type?: string; userId?: string }) {
    const where: any = { organizationId };
    if (params.type) where.type = params.type;
    if (params.from || params.to) {
      where.startDate = {};
      if (params.from) where.startDate.gte = new Date(params.from);
      if (params.to) where.startDate.lte = new Date(params.to);
    }
    if (params.userId) {
      where.OR = [
        { createdById: params.userId },
        { attendees: { some: { userId: params.userId } } },
      ];
    }

    return this.prisma.calendarEvent.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        attendees: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        attendees: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
    });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı');
    return event;
  }

  async create(organizationId: string, userId: string, data: any) {
    const { attendees, ...rest } = data;
    return this.prisma.calendarEvent.create({
      data: {
        ...rest,
        organizationId,
        createdById: userId,
        attendees: {
          create: [
            { email: '', name: 'Organizer', userId, isOrganizer: true, status: 'accepted' },
            ...(attendees?.map((a: any) => ({ ...a, status: 'pending' })) ?? []),
          ].filter((a: any) => a.email || a.userId),
        },
      },
      include: {
        attendees: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    await this.findOne(organizationId, id);
    const { attendees, ...rest } = data;
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...rest,
        ...(attendees !== undefined && {
          attendees: {
            deleteMany: { isOrganizer: false },
            create: attendees.map((a: any) => ({ ...a, status: 'pending' })),
          },
        }),
      },
    });
  }

  async delete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.calendarEvent.delete({ where: { id } });
  }

  async respondToInvite(organizationId: string, eventId: string, userId: string, status: string) {
    await this.findOne(organizationId, eventId);
    return this.prisma.eventAttendee.updateMany({
      where: { eventId, userId },
      data: { status },
    });
  }

  async getUpcoming(organizationId: string, userId: string, days = 7) {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + days);

    return this.prisma.calendarEvent.findMany({
      where: {
        organizationId,
        startDate: { gte: from, lte: to },
        status: { not: 'cancelled' },
        OR: [
          { createdById: userId },
          { attendees: { some: { userId } } },
        ],
      },
      include: {
        attendees: { select: { status: true, name: true, email: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }
}
