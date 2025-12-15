import { Injectable, BadRequestException } from '@nestjs/common';
import {
  FileValidationOptions,
  ValidationResult,
} from '../interfaces/file-validation.interface';

@Injectable()
export class FileValidationService {
  private readonly defaultOptions: FileValidationOptions = {
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  };

  /**
   * Valide un fichier unique (pour les avatars, etc.)
   */
  validateSingleFile(
    file: Express.Multer.File,
    options: Partial<FileValidationOptions> = {},
  ): ValidationResult {
    const config = { ...this.defaultOptions, ...options };
    const errors: string[] = [];

    // Vérifier si le fichier existe
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Vérifier le type MIME
    if (!config.allowedMimeTypes?.includes(file.mimetype)) {
      errors.push(
        `Invalid file type. Allowed: ${config.allowedMimeTypes?.join(', ')}`,
      );
    }

    // Vérifier la taille
    if (config.maxSize && file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      errors.push(`File size too large. Maximum: ${maxSizeMB}MB`);
    }

    // Vérifier l'extension
    if (config.allowedExtensions) {
      const fileExtension = this.getFileExtension(file.originalname);
      if (!config.allowedExtensions.includes(fileExtension.toLowerCase())) {
        errors.push(
          `Invalid file extension. Allowed: ${config.allowedExtensions.join(', ')}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Valide plusieurs fichiers (pour les uploads multiples)
   */
  validateMultipleFiles(
    files: Express.Multer.File[],
    options: Partial<FileValidationOptions> = {},
  ): ValidationResult {
    const config = { ...this.defaultOptions, ...options };
    const errors: string[] = [];

    // Vérifier le nombre de fichiers
    if (config.maxFiles && files.length > config.maxFiles) {
      errors.push(`Too many files. Maximum: ${config.maxFiles}`);
    }

    // Valider chaque fichier
    files.forEach((file, index) => {
      const result = this.validateSingleFile(file, config);
      if (!result.isValid && result.errors) {
        errors.push(`File ${index + 1}: ${result.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Récupère l'extension d'un fichier
   */
  getFileExtension(filename: string): string {
    return '.' + filename.split('.').pop()?.toLowerCase();
  }

  /**
   * Génère un nom de fichier sécurisé
   */
  generateSafeFilename(
    originalName: string,
    prefix?: string,
    timestamp: boolean = true,
  ): string {
    const extension = this.getFileExtension(originalName);
    const nameWithoutExt = originalName.replace(extension, '');

    // Nettoyer le nom de fichier
    const safeName = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const parts: string[] = [];
    if (prefix) parts.push(prefix);
    if (timestamp) parts.push(Date.now().toString());
    parts.push(safeName || 'file');

    return parts.join('-') + extension;
  }

  /**
   * Vérifie si un fichier est une image
   */
  isImage(file: Express.Multer.File): boolean {
    return file.mimetype.startsWith('image/');
  }

  /**
   * Vérifie si un fichier est un PDF
   */
  isPDF(file: Express.Multer.File): boolean {
    return file.mimetype === 'application/pdf';
  }

  /**
   * Options prédéfinies pour les avatars
   */
  getAvatarOptions(): FileValidationOptions {
    return {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 2 * 1024 * 1024, // 2MB pour les avatars
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    };
  }

  /**
   * Options prédéfinies pour les documents
   */
  getDocumentOptions(): FileValidationOptions {
    return {
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/json',
        'application/xml',
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.json', '.xml'],
    };
  }
}
