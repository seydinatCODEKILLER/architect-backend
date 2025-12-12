import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { EmailQueueService } from './email-queue.service';
import { EmailProcessor } from './email.processor';
import { BrevoService } from '../services/brevo.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: configService.get<number>('EMAIL_MAX_RETRIES', 3),
          backoff: {
            type: 'exponential',
            delay: configService.get<number>('EMAIL_RETRY_DELAY', 5000),
          },
        },
      }),
    }),
    BullModule.registerQueueAsync({
      name: 'emails',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        limiter: {
          max: configService.get<number>('EMAIL_RATE_LIMIT', 100),
          duration: configService.get<number>('EMAIL_RATE_DURATION', 3600000),
        },
        defaultJobOptions: {
          priority: 1,
          delay: 0,
          attempts: configService.get<number>('EMAIL_MAX_RETRIES', 3),
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
  ],
  providers: [EmailQueueService, EmailProcessor, BrevoService],
  exports: [EmailQueueService, BullModule],
})
export class QueueModule {}
