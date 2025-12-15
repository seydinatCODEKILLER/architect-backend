import { User } from '@prisma/client';

// Interface pour l'utilisateur authentifié
export type AuthUser = Omit<User, 'password' | 'legacyPassword'>;

// Interface pour les tokens JWT
export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Interface pour le payload JWT
export interface AuthJwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Interface pour la réponse de login/register
export interface AuthResponse {
  user: AuthUser;
  tokens: Tokens;
}

// Interface pour la session
export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

export type SessionWithUser = {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  lastUsedAt: Date;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
};

// Interface pour les statistiques d'authentification
export interface AuthStats {
  totalUsers: number;
  activeSessions: number;
  verifiedUsers: number;
}

// Interface pour les options d'authentification
export interface AuthOptions {
  requireEmailVerification: boolean;
  allowMultipleSessions: boolean;
  sessionExpiryDays: number;
  refreshTokenExpiryDays: number;
}
