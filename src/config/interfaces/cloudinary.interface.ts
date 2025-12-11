export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  access_mode: string;
  original_filename: string;
}

export interface CloudinaryOptions {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
  uploadPreset?: string;
}

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any[];
  tags?: string[];
}

export interface DeleteOptions {
  resource_type?: 'image' | 'video' | 'raw';
  type?: 'upload' | 'private' | 'authenticated';
  invalidate?: boolean;
}

export interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure: boolean;
}
