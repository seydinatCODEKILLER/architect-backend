import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthValidationUtil } from './utils/validation.util';
import { JwtAuthGuard, Public } from './guards';
import { CurrentUser } from './decorators';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UpdateProfileDto,
  RefreshTokenDto,
} from './dto';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import type { Request, Response } from 'express';
import {
  ApiAuthTags,
  ApiChangePassword,
  ApiCheckEmail,
  ApiGetProfile,
  ApiGetSessions,
  ApiGetStats,
  ApiLogin,
  ApiLogout,
  ApiPublicTags,
  ApiRefresh,
  ApiRegister,
  ApiResetPassword,
  ApiUploadAvatar,
  ApiVerifyEmail,
} from 'src/common/decorators/swagger.decorators';
import { CookieService } from 'src/config/services/cookie.service';
import { FileValidationService } from 'src/config/services/file-validation.service';
import type { AuthUser } from './interfaces';

@Controller('auth')
@ApiTags('🔐 Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly fileValidationService: FileValidationService,
    private readonly authValidationUtil: AuthValidationUtil,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiRegister()
  @ApiBody({ type: RegisterDto })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.authValidationUtil.validatePasswordsMatch(
      registerDto.password,
      registerDto.confirmPassword,
    );

    const authResponse = await this.authService.register({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    this.cookieService.setAuthCookies(response, authResponse.tokens);

    return {
      message: AUTH_CONSTANTS.SUCCESS.REGISTER_SUCCESS,
      data: authResponse,
    };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.rememberMe,
    );

    this.cookieService.setAuthCookies(response, authResponse.tokens);

    return {
      message: AUTH_CONSTANTS.SUCCESS.LOGIN_SUCCESS,
      data: authResponse,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuthTags()
  @ApiLogout()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { sessionId } = request.user as { sessionId?: string };

    if (sessionId) {
      await this.authService.logout(sessionId);
    }

    this.cookieService.clearAuthCookies(response);

    return {
      message: AUTH_CONSTANTS.SUCCESS.LOGOUT_SUCCESS,
    };
  }

  @Post('logout/all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuthTags()
  @ApiOperation({
    summary: 'Logout from all devices',
    description:
      'Logs out the user from all devices and clears all active sessions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out from all devices' },
      },
    },
  })
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(userId);
    this.cookieService.clearAuthCookies(response);

    return {
      message: 'Logged out from all devices',
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiRefresh()
  @ApiBody({ type: RefreshTokenDto })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );

    this.cookieService.setAuthCookies(response, tokens);

    return {
      message: 'Tokens refreshed successfully',
      data: tokens,
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiAuthTags()
  @ApiGetSessions()
  async getSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.authService.getUserSessions(userId);

    return {
      message: 'Sessions retrieved successfully',
      data: sessions,
    };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuthTags()
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID to revoke',
    example: 'session_123abc',
  })
  @ApiOperation({
    summary: 'Revoke specific session',
    description: 'Revokes a specific session by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Session revoked' },
      },
    },
  })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.revokeSession(sessionId, userId);

    return {
      message: AUTH_CONSTANTS.SUCCESS.SESSION_REVOKED,
    };
  }

  @Get('verify-email')
  @Public()
  @ApiVerifyEmail()
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const user = await this.authService.verifyEmail(token);

    // Generate tokens and auto-login
    const tokens = await this.authService['tokensUtil'].generateTokens(
      user.id,
      user.email,
    );
    this.cookieService.setAuthCookies(response, tokens);

    return {
      message: AUTH_CONSTANTS.SUCCESS.EMAIL_VERIFIED,
      data: { user },
    };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiPublicTags()
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset email to the provided email address.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset email sent' },
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(forgotPasswordDto.email);

    return {
      message: AUTH_CONSTANTS.SUCCESS.PASSWORD_RESET_SENT,
    };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiResetPassword()
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    this.authValidationUtil.validatePasswordsMatch(
      resetDto.newPassword,
      resetDto.confirmPassword,
    );

    await this.authService.resetPassword(resetDto.token, resetDto.newPassword);

    return {
      message: AUTH_CONSTANTS.SUCCESS.PASSWORD_RESET_SUCCESS,
    };
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuthTags()
  @ApiChangePassword()
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    this.authValidationUtil.validatePasswordsMatch(
      changePasswordDto.newPassword,
      changePasswordDto.confirmPassword,
    );

    await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      message: AUTH_CONSTANTS.SUCCESS.PASSWORD_CHANGED,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiAuthTags()
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/AuthUserResponse' },
          },
        },
      },
    },
  })
  getCurrentUser(@CurrentUser() user: AuthUser): {
    message: string;
    data: { user: AuthUser };
  } {
    return {
      message: 'User retrieved successfully',
      data: { user },
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiAuthTags()
  @ApiGetProfile()
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.authService.getUserProfile(userId);

    return {
      message: 'Profile retrieved successfully',
      data: { profile },
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuthTags()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates the profile information of the authenticated user.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile updated successfully' },
        data: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/AuthUserResponse' },
          },
        },
      },
    },
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.authService.updateProfile(userId, updateProfileDto);

    return {
      message: AUTH_CONSTANTS.SUCCESS.PROFILE_UPDATED,
      data: { user },
    };
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @HttpCode(HttpStatus.OK)
  @ApiAuthTags()
  @ApiUploadAvatar()
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const validation = this.fileValidationService.validateSingleFile(
      file,
      this.fileValidationService.getAvatarOptions(),
    );

    if (!validation.isValid) {
      throw new BadRequestException(validation.errors?.join(', '));
    }

    const avatarUrl = await this.authService.uploadAvatar(userId, file);

    return {
      message: AUTH_CONSTANTS.SUCCESS.AVATAR_UPDATED,
      data: { avatarUrl },
    };
  }

  @Delete('avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuthTags()
  @ApiOperation({
    summary: 'Remove avatar',
    description: 'Removes the current avatar of the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar removed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Avatar removed successfully' },
      },
    },
  })
  async removeAvatar(@CurrentUser('id') userId: string) {
    await this.authService.removeAvatar(userId);

    return {
      message: AUTH_CONSTANTS.SUCCESS.AVATAR_REMOVED,
    };
  }

  @Get('stats')
  @Public()
  @ApiGetStats()
  async getAuthStats() {
    const stats = await this.authService.getAuthStats();

    return {
      message: 'Auth statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('check-email')
  @Public()
  @ApiCheckEmail()
  async checkEmailExists(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const exists = await this.authService.userExists(email);

    return {
      message: 'Email check completed',
      data: { exists },
    };
  }
}
