// Interface pour la vérification d'email
export interface EmailVerificationToken {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Interface pour la réinitialisation de mot de passe
export interface PasswordResetToken {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

// Interface pour les données de token
export interface TokenData {
  userId: string;
  email: string;
  type: 'email_verification' | 'password_reset';
  expiresIn: string;
}

// Interface pour la validation de token
export interface TokenValidation {
  isValid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}
