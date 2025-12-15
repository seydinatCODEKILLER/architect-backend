import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiBody,
  ApiQuery,
  ApiConsumes,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import {
  AuthResponseDto,
  EmailVerifiedResponseDto,
  LogoutResponseDto,
  ProfileResponseDto,
  SessionsResponseDto,
  StatsResponseDto,
  TokensResponseDto,
} from 'src/auth';
import {
  EmailExistsResponse,
  ErrorResponse,
  SuccessResponse,
  ValidationErrorResponse,
} from '../dto/swagger.dto';

// Décorateur pour les endpoints d'authentification
export function ApiAuthTags() {
  return applyDecorators(
    ApiTags('🔐 Authentication'),
    ApiBearerAuth('JWT-auth'),
    ApiCookieAuth('cookie-auth'),
  );
}

// Décorateur pour les endpoints publics
export function ApiPublicTags() {
  return applyDecorators(ApiTags('🔐 Authentication'));
}

// Décorateur complet pour l'inscription
export function ApiRegister() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Creates a new user account with email and password validation.',
    }),
    ApiCreatedResponse({
      description: 'User registered successfully',
      type: AuthResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Validation error',
      type: ValidationErrorResponse,
    }),
    ApiConflictResponse({
      description: 'Email already exists',
      type: ErrorResponse,
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error',
      type: ErrorResponse,
    }),
  );
}

// Décorateur complet pour la connexion
export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Authenticate user',
      description: 'Authenticates a user with email and password.',
    }),
    ApiOkResponse({
      description: 'Login successful',
      type: AuthResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid credentials or email not verified',
      type: ErrorResponse,
    }),
    ApiBadRequestResponse({
      description: 'Validation error',
      type: ValidationErrorResponse,
    }),
  );
}

// Décorateur complet pour le refresh token
export function ApiRefresh() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description: 'Refreshes the access token using a valid refresh token.',
    }),
    ApiOkResponse({
      description: 'Tokens refreshed successfully',
      type: TokensResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid or expired refresh token',
      type: ErrorResponse,
    }),
  );
}

// Décorateur complet pour la déconnexion
export function ApiLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'Logout current session',
      description:
        'Logs out the current user session and clears authentication cookies.',
    }),
    ApiOkResponse({
      description: 'Logout successful',
      type: LogoutResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: ErrorResponse,
    }),
  );
}

// Décorateur complet pour les sessions
export function ApiGetSessions() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user sessions',
      description: 'Retrieves all active sessions for the current user.',
    }),
    ApiOkResponse({
      description: 'Sessions retrieved successfully',
      type: SessionsResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: ErrorResponse,
    }),
  );
}

// Décorateur complet pour le profil
export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user profile',
      description:
        'Retrieves the complete profile of the current user with statistics.',
    }),
    ApiOkResponse({
      description: 'Profile retrieved successfully',
      type: ProfileResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: ErrorResponse,
    }),
    ApiNotFoundResponse({
      description: 'User not found',
      type: ErrorResponse,
    }),
  );
}

// Décorateur complet pour la vérification d'email
export function ApiVerifyEmail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify email address',
      description:
        "Verifies a user's email address using a verification token.",
    }),
    ApiQuery({
      name: 'token',
      required: true,
      description: 'Email verification token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    ApiOkResponse({
      description: 'Email verified successfully',
      type: EmailVerifiedResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid or expired token',
      type: ErrorResponse,
    }),
  );
}

// Décorateur complet pour le reset password
export function ApiResetPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reset password',
      description: 'Resets user password using a reset token.',
    }),
    ApiOkResponse({
      description: 'Password reset successfully',
      type: SuccessResponse,
    }),
    ApiBadRequestResponse({
      description: 'Invalid token or weak password',
      type: ValidationErrorResponse,
    }),
  );
}

// Décorateur complet pour le changement de mot de passe
export function ApiChangePassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change password',
      description: 'Changes the password for the authenticated user.',
    }),
    ApiOkResponse({
      description: 'Password changed successfully',
      type: SuccessResponse,
    }),
    ApiUnauthorizedResponse({
      description: 'Current password is incorrect',
      type: ErrorResponse,
    }),
    ApiBadRequestResponse({
      description: 'Passwords do not match or weak password',
      type: ValidationErrorResponse,
    }),
  );
}

// Décorateur pour l'upload d'avatar
export function ApiUploadAvatar() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload avatar',
      description: 'Uploads a new avatar image for the user.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          avatar: {
            type: 'string',
            format: 'binary',
            description: 'Image file (JPEG, PNG, GIF, WebP) - Max 5MB',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Avatar uploaded successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Avatar updated successfully' },
          data: {
            type: 'object',
            properties: {
              avatarUrl: {
                type: 'string',
                example: 'https://cloudinary.com/avatar.jpg',
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid file type or size',
      type: ErrorResponse,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: ErrorResponse,
    }),
  );
}

// Décorateur pour les statistiques
export function ApiGetStats() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get auth statistics',
      description: 'Retrieves global authentication statistics.',
    }),
    ApiOkResponse({
      description: 'Statistics retrieved successfully',
      type: StatsResponseDto,
    }),
  );
}

// Décorateur pour vérifier l'email
export function ApiCheckEmail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Check if email exists',
      description: 'Checks if an email address is already registered.',
    }),
    ApiQuery({
      name: 'email',
      required: true,
      description: 'Email address to check',
      example: 'john.doe@example.com',
    }),
    ApiOkResponse({
      description: 'Email check completed',
      type: EmailExistsResponse,
    }),
    ApiBadRequestResponse({
      description: 'Email parameter missing',
      type: ErrorResponse,
    }),
  );
}
