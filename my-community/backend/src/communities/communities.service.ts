import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.community.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            visitors: true,
            blocks: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const community = await this.prisma.community.findUnique({
      where: { id },
      include: {
        blocks: {
          include: {
            units: true,
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return community;
  }

  async create(data: { name: string; code: string; address: string; city: string; state: string; postalCode: string }) {
    return this.prisma.community.create({
      data,
    });
  }
}
