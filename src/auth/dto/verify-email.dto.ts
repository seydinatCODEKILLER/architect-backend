import { IsString, IsEmail } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'Le token de vérification est requis' })
  token: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  email: string;
}
