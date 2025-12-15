import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary.module';
import { CloudinaryService } from '../services/cloudinary.service';
import { BrevoModule } from './brevo.module';
import { QueueModule } from '../queue/queue.module';
import { BrevoService } from '../services/brevo.service';
import { EmailQueueService } from '../queue/email-queue.service';
import { CookieModule } from './cookie.module';
import { FileValidationModule } from './file-validation.module';
import { CookieService } from '../services/cookie.service';
import { FileValidationService } from '../services/file-validation.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    CloudinaryModule,
    BrevoModule,
    QueueModule,
    CookieModule,
    FileValidationModule,
  ],
  providers: [
    CloudinaryService,
    BrevoService,
    EmailQueueService,
    CookieService,
    FileValidationService,
  ],
  exports: [
    CloudinaryService,
    BrevoService,
    EmailQueueService,
    CookieService,
    FileValidationService,
    NestConfigModule,
  ],
})
export class ConfigModule {}
