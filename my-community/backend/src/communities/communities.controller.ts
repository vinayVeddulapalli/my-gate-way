import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Communities')
@Controller('api/v1/communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered communities' })
  async findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community details with blocks and units' })
  async findOne(@Param('id') id: string) {
    return this.communitiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new gated community' })
  async create(
    @Body()
    dto: {
      name: string;
      code: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
    },
  ) {
    return this.communitiesService.create(dto);
  }
}
