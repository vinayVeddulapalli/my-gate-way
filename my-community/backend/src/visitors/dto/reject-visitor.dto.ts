import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectVisitorDto {
  @ApiProperty({ example: 'Not expecting any guests right now', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
