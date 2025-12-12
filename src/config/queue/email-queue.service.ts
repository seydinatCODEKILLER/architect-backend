import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  EmailJobData,
  EmailJobType,
  WelcomeEmailData,
  VerificationEmailData,
  PasswordResetEmailData,
  CustomEmailData,
  QueueStats,
} from '../interfaces/queue.interface';
import type { Job } from 'bull';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue('emails') private readonly emailQueue: Queue) {}

  /**
   * Ajoute un email de bienvenue à la queue
   */
  async addWelcomeEmail(data: WelcomeEmailData): Promise<string> {
    const job = await this.emailQueue.add(
      EmailJobType.WELCOME,
      {
        type: EmailJobType.WELCOME,
        data,
      } as EmailJobData,
      {
        priority: 1,
        attempts: 3,
        backoff: 5000,
      },
    );

    // Conversion en string pour garantir la cohérence
    const jobId = String(job.id);

    this.logger.log(`Welcome email job added: ${jobId}`);
    return jobId;
  }

  /**
   * Ajoute un email de vérification à la queue
   */
  async addVerificationEmail(data: VerificationEmailData): Promise<string> {
    const job = await this.emailQueue.add(
      EmailJobType.VERIFICATION,
      {
        type: EmailJobType.VERIFICATION,
        data,
      } as EmailJobData,
      {
        priority: 2, // Très haute priorité (sécurité)
        attempts: 3,
        backoff: 3000,
        lifo: true, // Last In First Out pour les verifications
      },
    );

    const jobId = String(job.id);
    this.logger.log(`Verification email job added: ${job.id}`);
    return jobId;
  }

  /**
   * Ajoute un email de réinitialisation de mot de passe à la queue
   */
  async addPasswordResetEmail(data: PasswordResetEmailData): Promise<string> {
    const job = await this.emailQueue.add(
      EmailJobType.PASSWORD_RESET,
      {
        type: EmailJobType.PASSWORD_RESET,
        data,
      } as EmailJobData,
      {
        priority: 2, // Très haute priorité (sécurité)
        attempts: 3,
        backoff: 3000,
      },
    );

    const jobId = String(job.id);
    this.logger.log(`Password reset email job added: ${job.id}`);
    return jobId;
  }

  /**
   * Ajoute un email personnalisé à la queue
   */
  async addCustomEmail(data: CustomEmailData): Promise<string> {
    const job = await this.emailQueue.add(
      EmailJobType.CUSTOM,
      {
        type: EmailJobType.CUSTOM,
        data,
      } as EmailJobData,
      {
        priority: 3, // Priorité normale
        attempts: 3,
        backoff: 10000,
      },
    );

    const jobId = String(job.id);
    this.logger.log(`Custom email job added: ${job.id}`);
    return jobId;
  }

  /**
   * Récupère les statistiques de la queue
   */
  async getQueueStats(): Promise<QueueStats> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Vide la queue (développement/test seulement)
   */
  async emptyQueue(): Promise<void> {
    await this.emailQueue.empty();
    this.logger.log('Email queue emptied');
  }

  /**
   * Récupère les jobs échoués
   */
  async getFailedJobs(limit: number = 50): Promise<
    Array<{
      id: string;
      data: EmailJobData;
      failedReason: string;
      stacktrace: string[];
      timestamp: Date;
      processedOn?: Date;
      finishedOn?: Date;
    }>
  > {
    const failedJobs = await this.emailQueue.getFailed(0, limit - 1);

    return failedJobs.map((job: Job<EmailJobData>) => ({
      id: String(job.id),
      data: job.data,
      failedReason: job.failedReason ?? '',
      stacktrace: job.stacktrace ?? [],
      timestamp: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : undefined,
    }));
  }

  /**
   * Relance un job échoué
   */
  async retryFailedJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      await job.retry();
      this.logger.log(`Job ${jobId} retried`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to retry job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Nettoie les anciens jobs
   */
  async cleanOldJobs(grace: number = 1000 * 60 * 60 * 24): Promise<void> {
    // Supprime les jobs complétés de plus de 24h
    await this.emailQueue.clean(grace, 'completed');

    // Supprime les jobs échoués de plus de 7 jours
    await this.emailQueue.clean(1000 * 60 * 60 * 24 * 7, 'failed');

    this.logger.log('Old jobs cleaned from queue');
  }

  /**
   * Vérifie l'état de la queue
   */
  async getQueueHealth(): Promise<{
    healthy: boolean;
    stats: QueueStats;
    redisConnected: boolean;
  }> {
    try {
      const stats = await this.getQueueStats();
      const client = this.emailQueue.client;

      // Test Redis connection
      const pingResponse = await client.ping();

      return {
        healthy: true,
        stats,
        redisConnected: pingResponse === 'PONG',
      };
    } catch (error) {
      this.logger.error('Queue health check failed:', error);
      return {
        healthy: false,
        stats: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
        redisConnected: false,
      };
    }
  }
}
