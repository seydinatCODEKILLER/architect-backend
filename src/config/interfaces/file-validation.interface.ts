export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxSize?: number; // en bytes
  maxFiles?: number;
  allowedExtensions?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}
