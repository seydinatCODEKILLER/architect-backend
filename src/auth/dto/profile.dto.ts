import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsUrl({}, { message: "L'URL de l'avatar doit être valide" })
  @IsOptional()
  avatarUrl?: string | null;
}
