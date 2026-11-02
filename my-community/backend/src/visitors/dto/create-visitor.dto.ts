import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VisitorPurpose } from '@prisma/client';

export class CreateVisitorDto {
  @ApiProperty({ example: 'u0a80101-0000-0000-0000-000000000001', description: 'Destination Unit/Flat UUID' })
  @IsNotEmpty()
  @IsString()
  unitId: string;

  @ApiProperty({ example: 'c0a80101-0000-0000-0000-000000000001', description: 'Community UUID' })
  @IsNotEmpty()
  @IsString()
  communityId: string;

  @ApiProperty({ example: 'Vikram Singh', description: 'Full name of the visitor' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '9811223344', description: 'Phone number of the visitor' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: VisitorPurpose, default: VisitorPurpose.GUEST, description: 'Purpose of entry' })
  @IsOptional()
  @IsEnum(VisitorPurpose)
  purpose?: VisitorPurpose;

  @ApiProperty({ example: 'DL 01 AB 1234', required: false, description: 'Vehicle registration number if any' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;
}
