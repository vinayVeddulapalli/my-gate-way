import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Units & Directory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @ApiOperation({ summary: 'List all flats/units in a community with their residents' })
  @ApiQuery({ name: 'communityId', required: true })
  async getUnits(@Query('communityId') communityId: string) {
    return this.unitsService.getUnitsByCommunity(communityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific flat/unit' })
  async getUnitDetails(@Param('id') id: string) {
    return this.unitsService.getUnitDetails(id);
  }
}
