import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { RejectVisitorDto } from './dto/reject-visitor.dto';
import { VisitorStatus, UserRole } from '@prisma/client';

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guard registers a new visitor arriving at the community gate
   */
  async registerVisitor(guardId: string, dto: CreateVisitorDto) {
    // 1. Verify Unit belongs to the Community
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: dto.unitId,
        block: { communityId: dto.communityId },
      },
      include: {
        block: true,
        memberships: {
          where: { isApproved: true },
          include: { user: true },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Destination unit not found in this community`);
    }

    // 2. Generate 4-digit random verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Prevent duplicate active visitor with same phone within last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingActive = await this.prisma.visitor.findFirst({
      where: {
        phone: dto.phone,
        unitId: dto.unitId,
        status: { in: [VisitorStatus.PENDING, VisitorStatus.APPROVED, VisitorStatus.CHECKED_IN] },
        createdAt: { gte: oneHourAgo },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        `An active visitor request already exists for this phone number and unit (Status: ${existingActive.status})`
      );
    }

    // 4. Create visitor record with PENDING status
    const visitor = await this.prisma.visitor.create({
      data: {
        communityId: dto.communityId,
        unitId: dto.unitId,
        guardId,
        name: dto.name,
        phone: dto.phone,
        purpose: dto.purpose || 'GUEST',
        vehicleNumber: dto.vehicleNumber,
        status: VisitorStatus.PENDING,
        verificationCode,
      },
      include: {
        unit: {
          include: { block: true },
        },
      },
    });

    // 5. Zero-cost Notification logging
    const residentNames = unit.memberships.map((m) => m.user.fullName).join(', ');
    this.logger.log(
      `[SIMULATED PUSH NOTIFICATION] To Residents of Flat ${unit.unitNumber} (${residentNames || 'No registered resident'}): Visitor ${visitor.name} (${visitor.purpose}) is at the gate waiting for your approval.`
    );

    // 6. Record Audit Log
    await this.prisma.auditLog.create({
      data: {
        communityId: dto.communityId,
        userId: guardId,
        action: 'VISITOR_REGISTERED',
        details: JSON.stringify({
          visitorId: visitor.id,
          visitorName: visitor.name,
          unitNumber: unit.unitNumber,
          verificationCode,
        }),
      },
    });

    return {
      message: 'Visitor registered successfully. Waiting for resident approval.',
      visitor,
      destinationUnit: `${unit.block.name} - ${unit.unitNumber}`,
      registeredResidentsCount: unit.memberships.length,
    };
  }

  /**
   * Resident approves visitor entry
   */
  async approveVisitor(residentId: string, visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id: visitorId },
      include: { unit: true },
    });

    if (!visitor) {
      throw new NotFoundException('Visitor request not found');
    }

    // State machine check: Must be PENDING
    if (visitor.status !== VisitorStatus.PENDING) {
      throw new BadRequestException(`Cannot approve visitor with status: ${visitor.status}`);
    }

    // Check that resident belongs to this unit (or is an Admin)
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: residentId,
        OR: [
          { unitId: visitor.unitId },
          { role: { in: [UserRole.COMMUNITY_ADMIN, UserRole.SUPER_ADMIN] } },
        ],
        isApproved: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not authorized to approve visitors for this flat');
    }

    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: {
        status: VisitorStatus.APPROVED,
        residentId,
      },
      include: { unit: { include: { block: true } } },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        communityId: visitor.communityId,
        userId: residentId,
        action: 'VISITOR_APPROVED',
        details: JSON.stringify({ visitorId, visitorName: visitor.name }),
      },
    });

    this.logger.log(`[GATE ALERT] Visitor ${visitor.name} has been APPROVED for entry by resident.`);

    return {
      message: 'Visitor approved successfully. Guard can now check them in.',
      visitor: updated,
    };
  }

  /**
   * Resident rejects visitor entry
   */
  async rejectVisitor(residentId: string, visitorId: string, dto?: RejectVisitorDto) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      throw new NotFoundException('Visitor request not found');
    }

    if (visitor.status !== VisitorStatus.PENDING) {
      throw new BadRequestException(`Cannot reject visitor with current status: ${visitor.status}`);
    }

    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: {
        status: VisitorStatus.REJECTED,
        residentId,
        rejectionReason: dto?.reason || 'Declined by resident',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        communityId: visitor.communityId,
        userId: residentId,
        action: 'VISITOR_REJECTED',
        details: JSON.stringify({ visitorId, reason: dto?.reason }),
      },
    });

    this.logger.warn(`[GATE ALERT] Visitor ${visitor.name} entry was REJECTED by resident.`);

    return {
      message: 'Visitor rejected.',
      visitor: updated,
    };
  }

  /**
   * Guard checks in the visitor at gate
   */
  async checkInVisitor(guardId: string, visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id: visitorId },
      include: { unit: { include: { block: true } } },
    });

    if (!visitor) {
      throw new NotFoundException('Visitor record not found');
    }

    if (visitor.status === VisitorStatus.PENDING) {
      throw new BadRequestException('Cannot check in visitor: Waiting for resident approval.');
    }

    if (visitor.status === VisitorStatus.REJECTED) {
      throw new BadRequestException('Cannot check in visitor: Resident has REJECTED this visitor.');
    }

    if (visitor.status === VisitorStatus.CHECKED_IN) {
      throw new BadRequestException('Visitor is already checked in.');
    }

    if (visitor.status === VisitorStatus.CHECKED_OUT) {
      throw new BadRequestException('Visitor has already checked out and departed.');
    }

    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: {
        status: VisitorStatus.CHECKED_IN,
        checkInTime: new Date(),
      },
      include: { unit: { include: { block: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        communityId: visitor.communityId,
        userId: guardId,
        action: 'VISITOR_CHECKED_IN',
        details: JSON.stringify({ visitorId, checkInTime: updated.checkInTime }),
      },
    });

    return {
      message: 'Visitor checked in successfully.',
      visitor: updated,
    };
  }

  /**
   * Guard records visitor departure/exit
   */
  async checkOutVisitor(guardId: string, visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      throw new NotFoundException('Visitor record not found');
    }

    if (visitor.status !== VisitorStatus.CHECKED_IN) {
      throw new BadRequestException(`Cannot check out visitor who is not currently inside (Status: ${visitor.status})`);
    }

    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: {
        status: VisitorStatus.CHECKED_OUT,
        checkOutTime: new Date(),
      },
      include: { unit: { include: { block: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        communityId: visitor.communityId,
        userId: guardId,
        action: 'VISITOR_CHECKED_OUT',
        details: JSON.stringify({ visitorId, checkOutTime: updated.checkOutTime }),
      },
    });

    return {
      message: 'Visitor checked out successfully.',
      visitor: updated,
    };
  }

  /**
   * Get all live visitors inside or pending at gate
   */
  async getLiveVisitors(communityId: string) {
    return this.prisma.visitor.findMany({
      where: {
        communityId,
        status: { in: [VisitorStatus.PENDING, VisitorStatus.APPROVED, VisitorStatus.CHECKED_IN] },
      },
      include: {
        unit: { include: { block: true } },
        guard: { select: { fullName: true, phone: true } },
        resident: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get visitor history with filters
   */
  async getVisitorHistory(communityId: string, unitId?: string, status?: VisitorStatus) {
    const where: any = { communityId };
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;

    return this.prisma.visitor.findMany({
      where,
      include: {
        unit: { include: { block: true } },
        guard: { select: { fullName: true } },
        resident: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
