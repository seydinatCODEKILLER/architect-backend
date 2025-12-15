import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Le refresh token est requis' })
  refreshToken: string;
}
