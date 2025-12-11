import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock de cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      upload: jest.fn(),
      destroy: jest.fn(),
    },
    utils: {
      api_sign_request: jest.fn(),
    },
    url: jest.fn(),
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: DeepMockProxy<ConfigService>;

  beforeEach(async () => {
    // Mock du ConfigService
    configService = mockDeep<ConfigService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should log warning when credentials are missing', () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return null;
        if (key === 'CLOUDINARY_API_KEY') return null;
        if (key === 'CLOUDINARY_API_SECRET') return null;
        if (key === 'CLOUDINARY_FOLDER') return 'architect';
        return null;
      });

      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      // Act
      service.onModuleInit();

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cloudinary credentials are missing'),
      );
      loggerWarnSpy.mockRestore();
    });

    it('should initialize when credentials are present', () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'test-cloud';
        if (key === 'CLOUDINARY_API_KEY') return 'test-key';
        if (key === 'CLOUDINARY_API_SECRET') return 'test-secret';
        if (key === 'CLOUDINARY_FOLDER') return 'architect';
        return null;
      });

      // ✅ Spying sur logger.log, pas warn
      const loggerLogSpy = jest.spyOn(service['logger'], 'log');

      // Act
      service.onModuleInit();

      // Assert
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cloudinary initialized'),
      );
      loggerLogSpy.mockRestore();
    });
  });

  describe('isConfigured', () => {
    it('should return false when credentials are missing', () => {
      // Arrange
      configService.get.mockReturnValue(null);

      // Act
      const result = service.isConfigured();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when all credentials are present', () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'test-cloud';
        if (key === 'CLOUDINARY_API_KEY') return 'test-key';
        if (key === 'CLOUDINARY_API_SECRET') return 'test-secret';
        return null;
      });

      // Act
      const result = service.isConfigured();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('generateImageUrl', () => {
    it('should call cloudinary.url with correct parameters', () => {
      // Arrange
      const publicId = 'test/image.jpg';
      const transformations = [{ width: 300, height: 300 }];

      // Act
      service.generateImageUrl(publicId, transformations);

      // Assert
      expect(cloudinary.url).toHaveBeenCalledWith(publicId, {
        secure: true,
        resource_type: 'image',
        transformation: transformations,
      });
    });
  });

  describe('generateThumbnailUrl', () => {
    it('should generate thumbnail URL with default parameters', () => {
      // Arrange
      const publicId = 'test/image.jpg';

      // Act
      service.generateThumbnailUrl(publicId);

      // Assert
      expect(cloudinary.url).toHaveBeenCalledWith(publicId, {
        secure: true,
        width: 300,
        height: 300,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });
    });

    it('should generate thumbnail URL with custom parameters', () => {
      // Arrange
      const publicId = 'test/image.jpg';

      // Act
      service.generateThumbnailUrl(publicId, 500, 500, 'fit');

      // Assert
      expect(cloudinary.url).toHaveBeenCalledWith(publicId, {
        secure: true,
        width: 500,
        height: 500,
        crop: 'fit',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });
    });
  });
});
