import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PasswordUtil, TokensUtil } from './utils';
import {
  AuthUser,
  AuthResponse,
  Tokens,
  Session,
  CreateUserData,
  UpdateUserData,
  UserProfile,
  AuthStats,
} from './interfaces';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import { PrismaService } from 'src/database/prisma.service';
import { BrevoService } from 'src/config/services/brevo.service';
import { CloudinaryService } from 'src/config/services/cloudinary.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly passwordUtil: PasswordUtil,
    private readonly tokensUtil: TokensUtil,
    private readonly brevoService: BrevoService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(createUserData: CreateUserData): Promise<AuthResponse> {
    try {
      // Vérifier si l'email existe déjà
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserData.email },
      });

      if (existingUser) {
        throw new ConflictException(AUTH_CONSTANTS.ERRORS.EMAIL_ALREADY_EXISTS);
      }

      // Valider la force du mot de passe
      const passwordValidation = this.passwordUtil.validatePasswordStrength(
        createUserData.password,
      );

      if (!passwordValidation.valid) {
        throw new BadRequestException(passwordValidation.errors.join(', '));
      }

      // Hasher le mot de passe
      const hashedPassword = await this.passwordUtil.hashPassword(
        createUserData.password,
      );

      // Créer l'utilisateur
      const user = await this.prisma.user.create({
        data: {
          email: createUserData.email,
          password: hashedPassword,
          firstName: createUserData.firstName,
          lastName: createUserData.lastName,
          displayName:
            `${createUserData.firstName} ${createUserData.lastName}`.trim(),
          avatarUrl: createUserData.avatarUrl,
          emailVerified: !this.requireEmailVerification(),
        },
        select: this.getUserSelect(),
      });

      // Créer une session
      await this.createSession(user.id, { userAgent: 'Registration' });

      // Générer les tokens
      const tokens = await this.tokensUtil.generateTokens(user.id, user.email);

      // Envoyer l'email de vérification si nécessaire
      if (this.requireEmailVerification() && !user.emailVerified) {
        await this.sendVerificationEmail(user);
      } else if (!this.requireEmailVerification()) {
        // Envoyer l'email de bienvenue si pas de vérification requise
        await this.sendWelcomeEmail(user);
      }

      return {
        user: this.mapToAuthUser(user),
        tokens,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Registration error:', error);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Promise<AuthResponse> {
    try {
      // Trouver l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          ...this.getUserSelect(),
          password: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException(
          AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
        );
      }

      // Vérifier le mot de passe
      const isValidPassword = await this.passwordUtil.verifyPassword(
        password,
        user.password || '',
      );

      if (!isValidPassword) {
        throw new UnauthorizedException(
          AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
        );
      }

      // Vérifier si l'email est vérifié
      if (this.requireEmailVerification() && !user.emailVerified) {
        throw new UnauthorizedException(
          AUTH_CONSTANTS.ERRORS.EMAIL_NOT_VERIFIED,
        );
      }

      // Créer une session
      await this.createSession(user.id, { userAgent: 'Login', rememberMe });

      // Générer les tokens
      const tokens = await this.tokensUtil.generateTokens(user.id, user.email);

      // Mettre à jour la date de dernière connexion
      await this.updateLastLogin(user.id);

      return {
        user: this.mapToAuthUser(user),
        tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Login error:', error);
      throw new InternalServerErrorException('Failed to login');
    }
  }

  /**
   * Déconnexion (session actuelle)
   */
  async logout(sessionId: string): Promise<void> {
    try {
      await this.prisma.session.delete({
        where: { id: sessionId },
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Ne pas throw pour éviter de bloquer le processus
    }
  }

  /**
   * Déconnexion de toutes les sessions d'un utilisateur
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    } catch (error) {
      console.error('Logout all error:', error);
    }
  }

  /**
   * Rafraîchir les tokens
   */
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      // Vérifier que le refresh token existe et est valide
      const session = await this.prisma.session.findFirst({
        where: {
          refreshToken,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              emailVerified: true,
            },
          },
        },
      });

      if (!session) {
        throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.SESSION_EXPIRED);
      }

      // Vérifier si l'email est vérifié
      if (this.requireEmailVerification() && !session.user.emailVerified) {
        throw new UnauthorizedException(
          AUTH_CONSTANTS.ERRORS.EMAIL_NOT_VERIFIED,
        );
      }

      // Mettre à jour la date d'utilisation
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });

      // Générer de nouveaux tokens
      return await this.tokensUtil.generateTokens(
        session.userId,
        session.user.email,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN);
    }
  }

  /**
   * Récupérer les sessions actives d'un utilisateur
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    }));
  }

  /**
   * Révoquer une session spécifique
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Envoyer l'email de vérification
   */
  async sendVerificationEmail(user: AuthUser): Promise<void> {
    if (!this.brevoService.isServiceConfigured()) {
      console.warn('Brevo service not configured, skipping verification email');
      return;
    }

    try {
      // Générer un token de vérification
      const token = this.tokensUtil.generateEmailVerificationToken();
      const expiresAt = this.tokensUtil.calculateExpiryDate('24h');

      // Sauvegarder le token
      await this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          email: user.email,
          token,
          expiresAt,
        },
      });

      // Générer l'URL de vérification
      const verificationUrl = `${this.configService.get(
        'FRONTEND_URL',
        'http://localhost:3001',
      )}/verify-email?token=${token}`;

      // Envoyer l'email via Brevo
      await this.brevoService.sendVerificationEmail(
        user.email,
        user.firstName || user.email,
        token,
        verificationUrl,
        24, // Expire dans 24 heures
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }

  /**
   * Vérifier l'email avec un token
   */
  async verifyEmail(token: string): Promise<AuthUser> {
    try {
      // Trouver le token
      const verificationToken =
        await this.prisma.emailVerificationToken.findFirst({
          where: {
            token,
            expiresAt: { gt: new Date() },
          },
          include: {
            user: {
              select: this.getUserSelect(),
            },
          },
        });

      if (!verificationToken) {
        throw new BadRequestException(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN);
      }

      // Vérifier que l'utilisateur existe
      if (!verificationToken.user) {
        throw new NotFoundException(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND);
      }

      // Marquer l'email comme vérifié
      const updatedUser = await this.prisma.user.update({
        where: { id: verificationToken.user.id },
        data: { emailVerified: true },
        select: this.getUserSelect(),
      });

      // Supprimer le token utilisé
      await this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      // Envoyer l'email de bienvenue maintenant que l'email est vérifié
      await this.sendWelcomeEmail(updatedUser);

      return this.mapToAuthUser(updatedUser);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  /**
   * Renvoyer l'email de vérification
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: this.getUserSelect(),
    });

    if (!user) {
      throw new NotFoundException(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Supprimer les anciens tokens
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Envoyer un nouvel email
    await this.sendVerificationEmail(user);
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: this.getUserSelect(),
    });

    if (!user) {
      // Ne pas révéler que l'utilisateur n'existe pas
      return;
    }

    if (!this.brevoService.isServiceConfigured()) {
      console.warn(
        'Brevo service not configured, skipping password reset email',
      );
      return;
    }

    try {
      // Générer un token de réinitialisation
      const token = this.tokensUtil.generatePasswordResetToken();
      const expiresAt = this.tokensUtil.calculateExpiryDate('30m');

      // Sauvegarder le token
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          email: user.email,
          token,
          expiresAt,
        },
      });

      // Générer l'URL de réinitialisation
      const resetUrl = `${this.configService.get(
        'FRONTEND_URL',
        'http://localhost:3001',
      )}/reset-password?token=${token}`;

      // Envoyer l'email via Brevo
      await this.brevoService.sendPasswordResetEmail(
        user.email,
        user.firstName || user.email,
        resetUrl,
        30, // Expire dans 30 minutes
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new InternalServerErrorException(
        'Failed to send password reset email',
      );
    }
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Trouver le token
      const resetToken = await this.prisma.passwordResetToken.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
          used: false,
        },
        include: {
          user: true,
        },
      });

      if (!resetToken) {
        throw new BadRequestException(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN);
      }

      // Valider la force du nouveau mot de passe
      const passwordValidation =
        this.passwordUtil.validatePasswordStrength(newPassword);

      if (!passwordValidation.valid) {
        throw new BadRequestException(passwordValidation.errors.join(', '));
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await this.passwordUtil.hashPassword(newPassword);

      // Mettre à jour le mot de passe
      await this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      // Marquer le token comme utilisé
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });

      // Déconnecter toutes les sessions existantes
      await this.logoutAll(resetToken.userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  /**
   * Changer le mot de passe (utilisateur connecté)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Récupérer l'utilisateur avec le mot de passe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new NotFoundException(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND);
      }

      // Vérifier l'ancien mot de passe
      const isValidPassword = await this.passwordUtil.verifyPassword(
        currentPassword,
        user.password || '',
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Valider la force du nouveau mot de passe
      const passwordValidation =
        this.passwordUtil.validatePasswordStrength(newPassword);

      if (!passwordValidation.valid) {
        throw new BadRequestException(passwordValidation.errors.join(', '));
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await this.passwordUtil.hashPassword(newPassword);

      // Mettre à jour le mot de passe
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Déconnecter toutes les sessions existantes (sécurité)
      await this.logoutAll(userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  /**
   * Récupérer le profil utilisateur
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...this.getUserSelect() },
    });

    if (!user) {
      throw new NotFoundException(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    // Récupérer les statistiques
    const stats = await this.getUserStats(userId);

    return {
      ...this.mapToAuthUser(user),
      stats,
    };
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(
    userId: string,
    updateData: UpdateUserData,
  ): Promise<AuthUser> {
    try {
      // Si un avatar est fourni, le valider
      if (updateData.avatarUrl && updateData.avatarUrl !== '') {
        // Optionnel: valider que c'est une URL Cloudinary valide
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          displayName:
            updateData.displayName ||
            (updateData.firstName && updateData.lastName
              ? `${updateData.firstName} ${updateData.lastName}`.trim()
              : undefined),
        },
        select: this.getUserSelect(),
      });

      return this.mapToAuthUser(updatedUser);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND);
      }

      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /**
   * Uploader un avatar
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!this.cloudinaryService.isConfigured()) {
      throw new InternalServerErrorException(
        'File storage service not configured',
      );
    }

    try {
      // Upload vers Cloudinary
      const uploadResult = await this.cloudinaryService.uploadBuffer(
        file.buffer,
        file.originalname,
        {
          folder: 'avatars',
          tags: ['avatar', `user:${userId}`],
        },
      );

      // Mettre à jour l'utilisateur avec la nouvelle URL d'avatar
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: uploadResult.secure_url },
      });

      return uploadResult.secure_url;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw new InternalServerErrorException('Failed to upload avatar');
    }
  }

  /**
   * Supprimer l'avatar
   */
  async removeAvatar(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (!user) {
      throw new NotFoundException(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    if (user.avatarUrl) {
      // Optionnel: supprimer l'image de Cloudinary
      const publicId = this.extractCloudinaryPublicId(user.avatarUrl);
      if (publicId && this.cloudinaryService.isConfigured()) {
        try {
          await this.cloudinaryService.deleteFile(publicId, {
            resource_type: 'image',
          });
        } catch (error) {
          console.error('Failed to delete avatar from Cloudinary:', error);
        }
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
  }

  /**
   * Récupérer les statistiques d'authentification
   */
  async getAuthStats(): Promise<AuthStats> {
    const [totalUsers, activeSessions, verifiedUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.session.count({
        where: { expiresAt: { gt: new Date() } },
      }),
      this.prisma.user.count({ where: { emailVerified: true } }),
    ]);

    return {
      totalUsers,
      activeSessions,
      verifiedUsers,
    };
  }

  /**
   * Récupérer les statistiques d'un utilisateur
   */
  private async getUserStats(userId: string) {
    const [architectureCount, diagramCount, adrCount] = await Promise.all([
      this.prisma.architecture.count({ where: { userId } }),
      this.prisma.diagram.count({
        where: { architecture: { userId } },
      }),
      this.prisma.architectureDecisionRecord.count({
        where: { architecture: { userId } },
      }),
    ]);

    return {
      architectureCount,
      diagramCount,
      adrCount,
    };
  }

  /**
   * Vérifier si un utilisateur existe par email
   */
  async userExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }

  /**
   * Créer une session utilisateur
   */
  private async createSession(
    userId: string,
    options: {
      userAgent?: string;
      ipAddress?: string;
      rememberMe?: boolean;
    } = {},
  ): Promise<Session> {
    const sessionExpiryDays = options.rememberMe
      ? this.configService.get<number>('SESSION_EXPIRY_DAYS_REMEMBER_ME', 30)
      : this.configService.get<number>('SESSION_EXPIRY_DAYS', 7);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + sessionExpiryDays);

    const refreshToken = await this.tokensUtil.generateRefreshToken(userId, '');

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
        expiresAt,
      },
    });

    return {
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    };
  }

  /**
   * Mettre à jour la date de dernière connexion
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      // Silently fail - not critical
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Envoyer l'email de bienvenue
   */
  private async sendWelcomeEmail(user: AuthUser): Promise<void> {
    if (!this.brevoService.isServiceConfigured()) {
      return;
    }

    try {
      const dashboardUrl = `${this.configService.get(
        'FRONTEND_URL',
        'http://localhost:3001',
      )}/dashboard`;

      await this.brevoService.sendWelcomeEmail(
        user.email,
        user.firstName || user.email,
        dashboardUrl,
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Ne pas throw - ce n'est pas critique
    }
  }

  /**
   * Vérifier si la vérification d'email est requise
   */
  private requireEmailVerification(): boolean {
    return this.configService.get<boolean>('EMAIL_VERIFICATION_ENABLED', true);
  }

  /**
   * Sélection des champs utilisateur
   */
  private getUserSelect() {
    return {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      emailVerified: true,
      authProvider: true,
      authProviderId: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    };
  }

  /**
   * Mapper l'utilisateur Prisma vers AuthUser
   */
  private mapToAuthUser(
    user: Omit<User, 'password' | 'legacyPassword'>,
  ): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider,
      authProviderId: user.authProviderId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Extraire l'ID public Cloudinary d'une URL
   */
  private extractCloudinaryPublicId(url: string): string | null {
    try {
      const matches = url.match(/upload\/(?:v\d+\/)?(.+?)\./);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}
