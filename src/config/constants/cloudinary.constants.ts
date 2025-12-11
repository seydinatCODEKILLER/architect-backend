export const CLOUDINARY_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'application/json',
    'application/zip',
  ],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  DEFAULT_TRANSFORMATIONS: {
    AVATAR: {
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto',
    },
    THUMBNAIL: {
      width: 300,
      height: 300,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
    },
    ARCHITECTURE_PREVIEW: {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto',
    },
  },
  FOLDERS: {
    AVATARS: 'avatars',
    ARCHITECTURES: 'architectures',
    DIAGRAMS: 'diagrams',
    TEMP: 'temp',
  },
} as const;
