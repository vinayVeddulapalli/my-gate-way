import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole, MembershipStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('A user with this phone number already exists');
    }

    // 2. Hash password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Create user in database
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
      },
    });

    // 4. If communityId provided, create a membership
    if (dto.communityId) {
      const community = await this.prisma.community.findUnique({
        where: { id: dto.communityId },
      });
      if (community) {
        await this.prisma.membership.create({
          data: {
            userId: user.id,
            communityId: dto.communityId,
            unitId: dto.unitId || null,
            role: dto.role || UserRole.RESIDENT,
            status: dto.role === UserRole.COMMUNITY_ADMIN ? MembershipStatus.APPROVED : MembershipStatus.PENDING,
            isApproved: dto.role === UserRole.COMMUNITY_ADMIN,
          },
        });
      }
    }

    return this.generateToken(user.id, user.phone, user.fullName);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: {
        memberships: {
          include: {
            community: { select: { id: true, name: true, code: true } },
            unit: { select: { id: true, unitNumber: true, blockId: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const tokenData = this.generateToken(user.id, user.phone, user.fullName);

    const { passwordHash, ...safeUser } = user;
    return {
      ...tokenData,
      user: safeUser,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            community: true,
            unit: {
              include: {
                block: true,
                floor: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private generateToken(userId: string, phone: string, fullName: string) {
    const payload = { sub: userId, phone, name: fullName };
    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };
  }
}
