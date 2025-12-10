import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ArchitectureFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isTemplate?: boolean;

  @IsOptional()
  @IsString()
  userId?: string;
}
