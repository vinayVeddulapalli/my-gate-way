import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUnitsByCommunity(communityId: string) {
    return this.prisma.unit.findMany({
      where: { communityId },
      include: {
        block: true,
        floor: true,
        memberships: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ block: { name: 'asc' } }, { unitNumber: 'asc' }],
    });
  }

  async getUnitDetails(unitId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        block: true,
        floor: true,
        memberships: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }
}
