import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import {
  CloudinaryConfig,
  UploadOptions,
  DeleteOptions,
  CloudinaryUploadResponse,
} from '../interfaces/cloudinary.interface';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly defaultFolder: string;
  private readonly uploadPreset?: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultFolder = this.configService.get<string>(
      'CLOUDINARY_FOLDER',
      'architect',
    );
    this.uploadPreset = this.configService.get<string>(
      'CLOUDINARY_UPLOAD_PRESET',
    );
  }

  onModuleInit() {
    this.initialize();
  }

  /**
   * Initialise la connexion à Cloudinary
   */
  protected initialize(): void {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary credentials are missing. Cloudinary service will be disabled.',
      );
      return;
    }

    const config: CloudinaryConfig = {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    };

    cloudinary.config(config);

    this.logger.log(`Cloudinary initialized with cloud: ${cloudName}`);
    this.logger.log(`Default folder: ${this.defaultFolder}`);
  }

  /**
   * Vérifie si Cloudinary est configuré
   */
  isConfigured(): boolean {
    return (
      !!this.configService.get<string>('CLOUDINARY_CLOUD_NAME') &&
      !!this.configService.get<string>('CLOUDINARY_API_KEY') &&
      !!this.configService.get<string>('CLOUDINARY_API_SECRET')
    );
  }

  /**
   * Upload un fichier depuis un buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    options: UploadOptions = {},
  ): Promise<CloudinaryUploadResponse> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || this.defaultFolder,
        public_id: options.public_id,
        overwrite: options.overwrite || false,
        resource_type: options.resource_type || 'auto',
        transformation: options.transformation,
        tags: options.tags,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Upload failed: ${error.message}`, error.stack);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            this.logger.log(`File uploaded: ${result.public_id}`);
            resolve(this.mapToResponse(result));
          }
        },
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload un fichier depuis une URL
   */
  async uploadFromUrl(
    url: string,
    options: UploadOptions = {},
  ): Promise<CloudinaryUploadResponse> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: options.folder || this.defaultFolder,
        public_id: options.public_id,
        overwrite: options.overwrite || false,
        resource_type: options.resource_type || 'auto',
        transformation: options.transformation,
        tags: options.tags,
      });

      this.logger.log(`URL uploaded: ${result.public_id}`);
      return this.mapToResponse(result);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };

      this.logger.error(
        `URL upload failed: ${err.message ?? 'Unknown error'}`,
        err.stack,
      );

      throw new Error(
        `Cloudinary URL upload failed: ${err.message ?? 'Unknown error'}`,
      );
    }
  }

  /**
   * Supprime un fichier de Cloudinary
   */
  async deleteFile(
    publicId: string,
    options: DeleteOptions = {},
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: options.resource_type || 'image',
        type: options.type || 'upload',
        invalidate: options.invalidate || true,
      });

      this.logger.log(`File deleted: ${publicId}`);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Cloudinary delete failed: ${err.message ?? 'Unknown error'}`,
        err.stack,
      );
      throw new Error(
        `Cloudinary delete failed: ${err.message ?? 'Unknown error'}`,
      );
    }
  }

  /**
   * Génère une URL signée pour un upload côté client
   */
  generateUploadSignature(
    folder?: string,
    publicId?: string,
    tags?: string[],
  ): {
    signature: string;
    timestamp: number;
    folder: string;
  } {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const uploadFolder = folder || this.defaultFolder;

    const paramsToSign: Record<string, any> = {
      timestamp,
      folder: uploadFolder,
      ...(publicId && { public_id: publicId }),
      ...(tags && tags.length > 0 && { tags: tags.join(',') }),
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.configService.get<string>('CLOUDINARY_API_SECRET')!,
    );

    return {
      signature,
      timestamp,
      folder: uploadFolder,
    };
  }

  /**
   * Génère une URL d'image avec transformations
   */
  generateImageUrl(
    publicId: string,
    transformations: any[] = [],
    resourceType: string = 'image',
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      transformation: transformations,
    });
  }

  /**
   * Génère une URL de thumbnail
   */
  generateThumbnailUrl(
    publicId: string,
    width: number = 300,
    height: number = 300,
    crop: string = 'fill',
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      width,
      height,
      crop,
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }

  /**
   * Mappe la réponse Cloudinary à notre interface
   */
  private mapToResponse(result: UploadApiResponse): CloudinaryUploadResponse {
    const ensureString = (value: any): string =>
      typeof value === 'string' ? value : String(value || '');

    const ensureNumber = (value: any): number =>
      typeof value === 'number' ? value : Number(value || 0);

    const ensureBoolean = (value: any): boolean =>
      typeof value === 'boolean' ? value : Boolean(value);

    return {
      asset_id: ensureString(result.asset_id),
      public_id: ensureString(result.public_id),
      version: ensureNumber(result.version),
      version_id: ensureString(result.version_id),
      signature: ensureString(result.signature),
      width: ensureNumber(result.width),
      height: ensureNumber(result.height),
      format: ensureString(result.format),
      resource_type: ensureString(result.resource_type),
      created_at: ensureString(result.created_at),
      tags: Array.isArray(result.tags) ? result.tags.map(ensureString) : [],
      bytes: ensureNumber(result.bytes),
      type: ensureString(result.type),
      etag: ensureString(result.etag),
      placeholder: ensureBoolean(result.placeholder),
      url: ensureString(result.url),
      secure_url: ensureString(result.secure_url),
      folder: ensureString(result.folder),
      access_mode: ensureString(result.access_mode),
      original_filename: ensureString(result.original_filename),
    };
  }
}
