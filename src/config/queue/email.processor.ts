import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { BrevoService } from '../services/brevo.service';
import {
  EmailJobData,
  EmailJobType,
  WelcomeEmailData,
  VerificationEmailData,
  PasswordResetEmailData,
  CustomEmailData,
} from '../interfaces/queue.interface';

@Processor('emails')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly brevoService: BrevoService) {}

  @OnQueueActive()
  @OnQueueActive()
  onActive(job: Job<EmailJobData>) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.data.type} - attempt ${job.attemptsMade + 1}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    const duration =
      job.finishedOn && job.processedOn
        ? job.finishedOn - job.processedOn
        : 'unknown';

    this.logger.log(`Job ${job.id} completed successfully in ${duration}ms`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }

  @Process(EmailJobType.WELCOME)
  async handleWelcomeEmail(job: Job<EmailJobData>) {
    const startTime = Date.now();
    const data = job.data.data as WelcomeEmailData;

    try {
      await this.brevoService.sendWelcomeEmail(
        data.to,
        data.name,
        data.dashboardUrl,
      );

      return {
        success: true,
        jobId: job.id,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${data.to}:`, error);
      throw error;
    }
  }

  @Process(EmailJobType.VERIFICATION)
  async handleVerificationEmail(job: Job<EmailJobData>) {
    const startTime = Date.now();
    const data = job.data.data as VerificationEmailData;

    try {
      await this.brevoService.sendVerificationEmail(
        data.to,
        data.name,
        data.code,
        data.verificationUrl,
        data.expiryHours,
      );

      return {
        success: true,
        jobId: job.id,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${data.to}:`,
        error,
      );
      throw error;
    }
  }

  @Process(EmailJobType.PASSWORD_RESET)
  async handlePasswordResetEmail(job: Job<EmailJobData>) {
    const startTime = Date.now();
    const data = job.data.data as PasswordResetEmailData;

    try {
      await this.brevoService.sendPasswordResetEmail(
        data.to,
        data.name,
        data.resetUrl,
        data.expiryMinutes,
      );

      return {
        success: true,
        jobId: job.id,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${data.to}:`,
        error,
      );
      throw error;
    }
  }

  @Process(EmailJobType.CUSTOM)
  async handleCustomEmail(job: Job<EmailJobData>) {
    const startTime = Date.now();
    const data = job.data.data as CustomEmailData;

    try {
      await this.brevoService.sendEmail({
        to: data.to,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
        templateId: data.templateId,
        params: data.params,
        attachments: data.attachments,
        cc: data.cc,
        bcc: data.bcc,
        replyTo: data.replyTo,
        tags: data.tags,
      });

      return {
        success: true,
        jobId: job.id,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Failed to send custom email:`, error);
      throw error;
    }
  }

  @Process(EmailJobType.NOTIFICATION)
  async handleNotificationEmail(job: Job<EmailJobData>) {
    const startTime = Date.now();
    const data = job.data.data as CustomEmailData;

    try {
      // Pour les notifications, on peut ajouter des tags spécifiques
      const tags = data.tags
        ? [...data.tags, 'notification']
        : ['notification'];

      await this.brevoService.sendEmail({
        ...data,
        tags,
      });

      return {
        success: true,
        jobId: job.id,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Failed to send notification email:`, error);
      throw error;
    }
  }
}
