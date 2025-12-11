import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsOptional()
  folder?: string;

  @IsString()
  @IsOptional()
  publicId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  overwrite?: boolean = false;
}

export class UploadFromUrlDto {
  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  folder?: string;

  @IsString()
  @IsOptional()
  publicId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class GenerateSignatureDto {
  @IsString()
  @IsOptional()
  folder?: string;

  @IsString()
  @IsOptional()
  publicId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class DeleteFileDto {
  @IsString()
  publicId: string;

  @IsString()
  @IsOptional()
  @IsEnum(['image', 'video', 'raw'])
  resourceType?: 'image' | 'video' | 'raw' = 'image';

  @IsString()
  @IsOptional()
  @IsEnum(['upload', 'private', 'authenticated'])
  type?: 'upload' | 'private' | 'authenticated' = 'upload';

  @IsOptional()
  invalidate?: boolean = true;
}
