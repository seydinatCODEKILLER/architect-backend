import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  email: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'Le token de réinitialisation est requis' })
  token: string;

  @IsString({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  newPassword: string;

  @IsString({ message: 'La confirmation du mot de passe est requise' })
  confirmPassword: string;
}
