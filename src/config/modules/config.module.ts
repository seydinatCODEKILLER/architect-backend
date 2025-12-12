import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary.module';
import { CloudinaryService } from '../services/cloudinary.service';
import { BrevoModule } from './brevo.module';
import { QueueModule } from '../queue/queue.module';
import { BrevoService } from '../services/brevo.service';
import { EmailQueueService } from '../queue/email-queue.service';

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
  ],
  providers: [CloudinaryService, BrevoService, EmailQueueService],
  exports: [
    CloudinaryService,
    BrevoService,
    EmailQueueService,
    NestConfigModule,
  ],
})
export class ConfigModule {}
