export const AUTH_CONSTANTS = {
  // Messages d'erreur
  ERRORS: {
    USER_NOT_FOUND: 'Utilisateur non trouvé',
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé',
    EMAIL_NOT_VERIFIED: 'Veuillez vérifier votre adresse email',
    INVALID_TOKEN: 'Token invalide ou expiré',
    TOKEN_EXPIRED: 'Token expiré',
    PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
    WEAK_PASSWORD: 'Le mot de passe est trop faible',
    UNAUTHORIZED: 'Non autorisé',
    SESSION_EXPIRED: 'Session expirée',
    RATE_LIMIT_EXCEEDED: 'Trop de tentatives, veuillez réessayer plus tard',
  },

  // Messages de succès
  SUCCESS: {
    REGISTER_SUCCESS: 'Inscription réussie',
    LOGIN_SUCCESS: 'Connexion réussie',
    LOGOUT_SUCCESS: 'Déconnexion réussie',
    EMAIL_VERIFICATION_SENT: 'Email de vérification envoyé',
    EMAIL_VERIFIED: 'Email vérifié avec succès',
    PASSWORD_RESET_SENT: 'Email de réinitialisation envoyé',
    PASSWORD_RESET_SUCCESS: 'Mot de passe réinitialisé avec succès',
    PASSWORD_CHANGED: 'Mot de passe changé avec succès',
    PROFILE_UPDATED: 'Profil mis à jour avec succès',
    AVATAR_UPDATED: 'Avatar mis à jour avec succès',
    AVATAR_REMOVED: 'Avatar supprimé avec succès',
    SESSION_REVOKED: 'Session révoquée avec succès',
  },

  // Configuration par défaut
  DEFAULTS: {
    SESSION_EXPIRY_DAYS: 7,
    REFRESH_TOKEN_EXPIRY_DAYS: 30,
    EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
    PASSWORD_RESET_EXPIRY_MINUTES: 30,
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 5,
  },

  // Types de tokens
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
    EMAIL_VERIFICATION: 'email_verification',
    PASSWORD_RESET: 'password_reset',
  },

  // Validation
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    DISPLAY_NAME_MAX_LENGTH: 50,
    BIO_MAX_LENGTH: 500,
  },

  // Routes publiques (ne nécessitent pas d'authentification)
  PUBLIC_ROUTES: [
    '/auth/register',
    '/auth/login',
    '/auth/refresh',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/health',
    '/docs',
  ],
} as const;
