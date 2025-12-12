import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsObject,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmailRecipientDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class EmailAttachmentDto {
  @IsString()
  name: string;

  @IsString()
  content: string;

  @IsString()
  contentType: string;
}

export class SendEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  to: EmailRecipientDto[];

  @IsString()
  subject: string;

  @IsString()
  @IsOptional()
  htmlContent?: string;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsNumber()
  @IsOptional()
  templateId?: number;

  @IsObject()
  @IsOptional()
  params?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  @IsOptional()
  cc?: EmailRecipientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  @IsOptional()
  bcc?: EmailRecipientDto[];

  @ValidateNested()
  @Type(() => EmailRecipientDto)
  @IsOptional()
  replyTo?: EmailRecipientDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  @IsOptional()
  attachments?: EmailAttachmentDto[];
}

export class SendTemplateEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  to: EmailRecipientDto[];

  @IsNumber()
  templateId: number;

  @IsObject()
  @IsOptional()
  params?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  @IsOptional()
  cc?: EmailRecipientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  @IsOptional()
  bcc?: EmailRecipientDto[];
}
