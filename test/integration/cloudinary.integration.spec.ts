import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../../src/config/config.module';
import { CloudinaryService } from '../../src/config/services/cloudinary.service';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement de test
dotenv.config({ path: '.env.test' });

describe('CloudinaryService Integration', () => {
  let service: CloudinaryService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('with real credentials', () => {
    it('should initialize without errors', () => {
      // Cette attente est OK car l'initialisation se fait dans onModuleInit
      expect(service).toBeDefined();

      // Vérifier si configuré (dépend des credentials dans .env.test)
      const isConfigured = service.isConfigured();
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should generate signature', () => {
      // Skip si non configuré
      if (!service.isConfigured()) {
        console.log('Skipping signature test - Cloudinary not configured');
        return;
      }

      const signature = service.generateUploadSignature('test-folder');

      expect(signature).toHaveProperty('signature');
      expect(signature).toHaveProperty('timestamp');
      expect(signature).toHaveProperty('folder', 'test-folder');
      expect(typeof signature.signature).toBe('string');
      expect(typeof signature.timestamp).toBe('number');
    });
  });
});
