// src/modules/auth/dto/swagger-auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  AuthResponse,
  AuthStatsResponse,
  EmailVerifiedDataDto,
  ProfileDataDto,
  SessionResponse,
  SuccessResponse,
  SuccessWithDataResponse,
  TokensResponse,
} from 'src/common/dto/swagger.dto';

// Réponses génériques pour l'auth
export class AuthResponseDto implements SuccessWithDataResponse<AuthResponse> {
  @ApiProperty({ example: 'Registration successful' })
  message: string;

  @ApiProperty({ type: AuthResponse })
  data: AuthResponse;
}

export class TokensResponseDto implements SuccessWithDataResponse<TokensResponse> {
  @ApiProperty({ example: 'Tokens refreshed successfully' })
  message: string;

  @ApiProperty({ type: TokensResponse })
  data: TokensResponse;
}

export class SessionsResponseDto implements SuccessWithDataResponse<
  SessionResponse[]
> {
  @ApiProperty({ example: 'Sessions retrieved successfully' })
  message: string;

  @ApiProperty({ type: [SessionResponse] })
  data: SessionResponse[];
}

export class ProfileResponseDto implements SuccessWithDataResponse<ProfileDataDto> {
  @ApiProperty({ example: 'Profile retrieved successfully' })
  message: string;

  @ApiProperty({ type: ProfileDataDto })
  data: ProfileDataDto;
}

export class StatsResponseDto implements SuccessWithDataResponse<AuthStatsResponse> {
  @ApiProperty({ example: 'Auth statistics retrieved successfully' })
  message: string;

  @ApiProperty({ type: AuthStatsResponse })
  data: AuthStatsResponse;
}

export class LogoutResponseDto implements SuccessResponse {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

export class EmailVerifiedResponseDto implements SuccessWithDataResponse<EmailVerifiedDataDto> {
  @ApiProperty({ example: 'Email verified successfully' })
  message: string;

  @ApiProperty({ type: EmailVerifiedDataDto })
  data: EmailVerifiedDataDto;
}
