import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// 🔐 AUTHENTIFICATION RESPONSES
// ============================================

export class AuthUserResponse {
  @ApiProperty({ example: 'user_123abc', description: 'User unique ID' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'John', description: 'First name', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name', required: false })
  lastName?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Display name',
    required: false,
  })
  displayName?: string;

  @ApiPropertyOptional({
    example: 'https://cloudinary.com/avatar.jpg',
    description: 'Avatar URL',
  })
  avatarUrl?: string;

  @ApiProperty({ example: true, description: 'Email verification status' })
  emailVerified: boolean;

  @ApiProperty({
    example: 'email',
    description: 'Auth provider',
    required: false,
  })
  authProvider?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last update date',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last login date',
  })
  lastLoginAt?: Date;
}

export class TokensResponse {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: 3600,
    description: 'Token expiration time in seconds',
  })
  expiresIn: number;
}

export class AuthResponse {
  @ApiProperty({ type: AuthUserResponse })
  user: AuthUserResponse;

  @ApiProperty({ type: TokensResponse })
  tokens: TokensResponse;
}

export class EmailVerifiedDataDto {
  @ApiProperty({ type: AuthUserResponse })
  user: AuthUserResponse;
}

// ============================================
// 🔄 SESSIONS RESPONSES
// ============================================

export class SessionResponse {
  @ApiProperty({ example: 'session_123abc', description: 'Session unique ID' })
  id: string;

  @ApiProperty({ example: 'user_123abc', description: 'User ID' })
  userId: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token',
  })
  refreshToken: string;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0...',
    description: 'User agent',
  })
  userAgent?: string;

  @ApiPropertyOptional({
    example: '192.168.1.1',
    description: 'IP address',
  })
  ipAddress?: string;

  @ApiProperty({
    example: '2024-01-22T10:30:00.000Z',
    description: 'Expiration date',
  })
  expiresAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T11:30:00.000Z',
    description: 'Last usage date',
  })
  lastUsedAt: Date;
}

// ============================================
// 👤 PROFILE RESPONSES
// ============================================

export class UserStatsResponse {
  @ApiProperty({ example: 5, description: 'Number of architectures' })
  architectureCount: number;

  @ApiProperty({ example: 12, description: 'Number of diagrams' })
  diagramCount: number;

  @ApiProperty({ example: 3, description: 'Number of ADRs' })
  adrCount: number;
}

export class UserProfileResponse extends AuthUserResponse {
  @ApiProperty({ type: UserStatsResponse })
  stats: UserStatsResponse;
}

export class ProfileDataDto {
  @ApiProperty({ type: UserProfileResponse })
  profile: UserProfileResponse;
}

// ============================================
// 📊 STATISTICS RESPONSES
// ============================================

export class AuthStatsResponse {
  @ApiProperty({ example: 150, description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ example: 45, description: 'Number of active sessions' })
  activeSessions: number;

  @ApiProperty({ example: 120, description: 'Number of verified users' })
  verifiedUsers: number;
}

// ============================================
// ✅ SUCCESS RESPONSES
// ============================================

export class SuccessResponse {
  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Success message',
  })
  message: string;
}

export class SuccessWithDataResponse<T> {
  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;
}

export class EmailExistsResponse {
  @ApiProperty({ example: 'Email check completed', description: 'Message' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      exists: { type: 'boolean', example: true },
    },
  })
  data: { exists: boolean };
}

// ============================================
// ❌ ERROR RESPONSES
// ============================================

export class ValidationErrorResponse {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: ['password must be at least 8 characters'],
    description: 'Validation errors',
    type: [String],
  })
  message: string[];

  @ApiProperty({ example: 'Bad Request', description: 'Error type' })
  error: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Timestamp',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/auth/register',
    description: 'Request path',
  })
  path: string;
}

export class ErrorResponse {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Invalid email or password',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({ example: 'Bad Request', description: 'Error type' })
  error: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Timestamp',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/auth/login',
    description: 'Request path',
  })
  path: string;
}

// ============================================
// 🔐 AUTH REQUEST EXAMPLES
// ============================================

export class RegisterExample {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'First name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
  })
  lastName: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password',
  })
  password: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password confirmation',
  })
  confirmPassword: string;
}

export class LoginExample {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password',
  })
  password: string;

  @ApiProperty({
    example: true,
    description: 'Remember me',
    required: false,
  })
  rememberMe?: boolean;
}
