import { Injectable, BadRequestException } from '@nestjs/common';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

@Injectable()
export class AuthValidationUtil {
  /**
   * Valider que les mots de passe correspondent
   */
  validatePasswordsMatch(password: string, confirmPassword: string): void {
    if (password !== confirmPassword) {
      throw new BadRequestException(AUTH_CONSTANTS.ERRORS.PASSWORD_MISMATCH);
    }
  }

  /**
   * Valider la force du mot de passe
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valider un email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider un token (format de base)
   */
  validateTokenFormat(token: string): void {
    if (!token || token.length < 10) {
      throw new BadRequestException('Invalid token format');
    }
  }

  /**
   * Valider les données de profil
   */
  validateProfileData(data: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
  }): void {
    const { firstName, lastName, displayName } = data;

    if (firstName && firstName.length > 50) {
      throw new BadRequestException('First name is too long');
    }

    if (lastName && lastName.length > 50) {
      throw new BadRequestException('Last name is too long');
    }

    if (displayName && displayName.length > 100) {
      throw new BadRequestException('Display name is too long');
    }
  }
}
