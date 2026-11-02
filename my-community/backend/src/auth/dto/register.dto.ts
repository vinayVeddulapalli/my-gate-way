import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: '9876543210', description: 'User unique phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'resident@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Rahul Sharma', description: 'User full name' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.RESIDENT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 'c0a80101-0000-0000-0000-000000000001', required: false, description: 'Community ID to join' })
  @IsOptional()
  @IsString()
  communityId?: string;

  @ApiProperty({ example: 'u0a80101-0000-0000-0000-000000000001', required: false, description: 'Unit/Flat ID' })
  @IsOptional()
  @IsString()
  unitId?: string;
}
