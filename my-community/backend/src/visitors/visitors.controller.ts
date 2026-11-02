import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { RejectVisitorDto } from './dto/reject-visitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VisitorStatus } from '@prisma/client';

@ApiTags('Visitor Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post()
  @ApiOperation({ summary: '1. Guard registers an arriving visitor at gate' })
  async register(@CurrentUser('id') guardId: string, @Body() dto: CreateVisitorDto) {
    return this.visitorsService.registerVisitor(guardId, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: '2. Resident approves visitor entry' })
  async approve(@CurrentUser('id') residentId: string, @Param('id') visitorId: string) {
    return this.visitorsService.approveVisitor(residentId, visitorId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: '3. Resident rejects visitor entry' })
  async reject(
    @CurrentUser('id') residentId: string,
    @Param('id') visitorId: string,
    @Body() dto: RejectVisitorDto,
  ) {
    return this.visitorsService.rejectVisitor(residentId, visitorId, dto);
  }

  @Patch(':id/check-in')
  @ApiOperation({ summary: '4. Guard checks in approved visitor upon entry' })
  async checkIn(@CurrentUser('id') guardId: string, @Param('id') visitorId: string) {
    return this.visitorsService.checkInVisitor(guardId, visitorId);
  }

  @Patch(':id/check-out')
  @ApiOperation({ summary: '5. Guard checks out departing visitor upon exit' })
  async checkOut(@CurrentUser('id') guardId: string, @Param('id') visitorId: string) {
    return this.visitorsService.checkOutVisitor(guardId, visitorId);
  }

  @Get('live')
  @ApiOperation({ summary: 'Get live visitor feed for society gate and admin' })
  @ApiQuery({ name: 'communityId', required: true })
  async getLive(@Query('communityId') communityId: string) {
    return this.visitorsService.getLiveVisitors(communityId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get visitor history log with optional filters' })
  @ApiQuery({ name: 'communityId', required: true })
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: VisitorStatus })
  async getHistory(
    @Query('communityId') communityId: string,
    @Query('unitId') unitId?: string,
    @Query('status') status?: VisitorStatus,
  ) {
    return this.visitorsService.getVisitorHistory(communityId, unitId, status);
  }
}
