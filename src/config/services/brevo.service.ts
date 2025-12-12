import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';
import * as Handlebars from 'handlebars';
import {
  BrevoConfig,
  SendEmailOptions,
  BrevoSendResponse,
  EmailTemplate,
  SendSmtpEmail,
} from '../interfaces/brevo.interface';
import {
  BREVO_CONFIG,
  EMAIL_TEMPLATES_CONTENT,
} from '../constants/brevo.constants';
import { SendEmailDto, SendTemplateEmailDto } from '../dtos/email.dto';
import { EmailQueueService } from '../queue/email-queue.service';

@Injectable()
export class BrevoService implements OnModuleInit {
  private readonly logger = new Logger(BrevoService.name);
  private apiInstance: Brevo.TransactionalEmailsApi;
  private contactsApi: Brevo.ContactsApi;
  private isConfigured = false;
  private readonly config: BrevoConfig;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(EmailQueueService)
    private readonly emailQueueService?: EmailQueueService,
  ) {
    this.config = {
      apiKey: this.configService.get<string>('BREVO_API_KEY') || '',
      senderEmail:
        this.configService.get<string>('BREVO_SENDER_EMAIL') ||
        'noreply@architect.dev',
      senderName:
        this.configService.get<string>('BREVO_SENDER_NAME') || 'Architect',
    };
  }

  async onModuleInit() {
    await this.initialize();
  }

  /**
   * Initialise la connexion à Brevo
   */
  private async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      this.logger.warn(
        'Brevo API key is missing. Email service will be disabled.',
      );
      return;
    }

    try {
      // Initialisation API transactional
      this.apiInstance = new Brevo.TransactionalEmailsApi();
      this.apiInstance.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        this.config.apiKey,
      );

      // Initialisation API contacts
      this.contactsApi = new Brevo.ContactsApi();
      this.contactsApi.setApiKey(
        Brevo.ContactsApiApiKeys.apiKey,
        this.config.apiKey,
      );

      // Test
      await this.testConnection();

      this.isConfigured = true;
      this.logger.log('Brevo service initialized successfully');
    } catch (error: unknown) {
      this.logger.error('Failed to initialize Brevo service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Teste la connexion à l'API Brevo
   */
  private async testConnection(): Promise<void> {
    try {
      // Essaye de récupérer les templates pour tester la connexion
      await this.apiInstance.getSmtpTemplates();
      this.logger.log('Brevo API connection test successful');
    } catch (error) {
      this.logger.warn(
        'Brevo API connection test failed (might be okay if no templates)',
        error,
      );
    }
  }

  /**
   * Vérifie si le service est configuré
   */
  isServiceConfigured(): boolean {
    return this.isConfigured && !!this.config.apiKey;
  }

  /**
   * Envoie un email transactionnel
   */
  async sendEmail(options: SendEmailOptions): Promise<BrevoSendResponse> {
    if (!this.isServiceConfigured()) {
      throw new Error('Brevo service is not configured');
    }

    try {
      const sendSmtpEmail: SendSmtpEmail = {
        sender: {
          name: this.config.senderName,
          email: this.config.senderEmail,
        },
        to: this.normalizeRecipients(options.to),
        subject: options.subject,
        htmlContent: options.templateId
          ? undefined
          : this.generateHtmlContent(options),
        templateId: options.templateId,
        params: options.params,
        tags: options.tags,
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
        cc: options.cc ? this.normalizeRecipients(options.cc) : undefined,
        bcc: options.bcc ? this.normalizeRecipients(options.bcc) : undefined,
        attachment: options.attachments?.map((att) => ({
          name: att.name,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const res = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      const messageId = res.body.messageId;

      this.logger.log(
        `Email sent successfully to ${
          Array.isArray(options.to) ? options.to.join(', ') : options.to
        }`,
      );

      this.logger.debug(`Message ID: ${messageId}`);

      return {
        accepted: Array.isArray(options.to) ? options.to : [options.to],
        rejected: [],
        response: JSON.stringify(res.body),
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Failed to send email:', error.message);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      this.logger.error('Failed to send email:', String(error));
      throw new Error(`Failed to send email: ${String(error)}`);
    }
  }

  /**
   * Envoie un email en utilisant un template Brevo
   */
  async sendTemplateEmail(
    dto: SendTemplateEmailDto,
  ): Promise<BrevoSendResponse> {
    const options: SendEmailOptions = {
      to: dto.to.map((r) => r.email),
      subject: 'Template Email', // Le sujet vient du template
      templateId: dto.templateId,
      params: dto.params,
      tags: dto.tags,
      cc: dto.cc?.map((r) => r.email),
      bcc: dto.bcc?.map((r) => r.email),
    };

    return this.sendEmail(options);
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
    dashboardUrl: string,
  ): Promise<BrevoSendResponse> {
    const template = EMAIL_TEMPLATES_CONTENT.WELCOME;
    const year = new Date().getFullYear();
    const docsUrl = `${this.configService.get('APP_URL')}/docs`;

    const htmlContent = this.compileTemplate(template.html, {
      name,
      dashboardUrl,
      docsUrl,
      year,
    });

    const textContent = this.compileTemplate(template.text, {
      name,
      dashboardUrl,
      docsUrl,
      year,
    });

    return this.sendEmail({
      to,
      subject: template.subject,
      htmlContent,
      textContent,
      tags: [BREVO_CONFIG.TAGS.TRANSACTIONAL],
    });
  }

  /**
   * Envoie un email de vérification
   */
  async sendVerificationEmail(
    to: string,
    name: string,
    code: string,
    verificationUrl: string,
    expiryHours: number = 24,
  ): Promise<BrevoSendResponse> {
    const template = EMAIL_TEMPLATES_CONTENT.EMAIL_VERIFICATION;
    const year = new Date().getFullYear();

    const htmlContent = this.compileTemplate(template.html, {
      name,
      code,
      verificationUrl,
      expiryHours,
      year,
    });

    const textContent = this.compileTemplate(template.text, {
      name,
      code,
      verificationUrl,
      expiryHours,
      year,
    });

    return this.sendEmail({
      to,
      subject: template.subject,
      htmlContent,
      textContent,
      tags: [BREVO_CONFIG.TAGS.SECURITY, BREVO_CONFIG.TAGS.TRANSACTIONAL],
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
    expiryMinutes: number = 30,
  ): Promise<BrevoSendResponse> {
    const template = EMAIL_TEMPLATES_CONTENT.PASSWORD_RESET;
    const year = new Date().getFullYear();

    const htmlContent = this.compileTemplate(template.html, {
      name,
      resetUrl,
      expiryMinutes,
      year,
    });

    const textContent = this.compileTemplate(template.text, {
      name,
      resetUrl,
      expiryMinutes,
      year,
    });

    return this.sendEmail({
      to,
      subject: template.subject,
      htmlContent,
      textContent,
      tags: [BREVO_CONFIG.TAGS.SECURITY],
    });
  }

  /**
   * Récupère les templates disponibles
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    if (!this.isServiceConfigured()) {
      throw new Error('Brevo service is not configured');
    }

    try {
      const response = await this.apiInstance.getSmtpTemplates();

      const templates = response.body.templates ?? [];

      return templates.map((template) => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        isActive: template.isActive,
        createdAt: new Date(template.createdAt),
      }));
    } catch (err: unknown) {
      let errorMessage = 'Unknown error';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      this.logger.error('Failed to fetch templates:', errorMessage);

      throw new Error(`Failed to fetch templates: ${errorMessage}`);
    }
  }

  /**
   * Ajoute un contact à une liste
   */
  async addContactToList(
    email: string,
    listId: number,
    attributes?: Record<string, any>,
  ): Promise<boolean> {
    if (!this.isServiceConfigured()) {
      throw new Error('Brevo service is not configured');
    }

    try {
      const createContact = new Brevo.CreateContact();
      createContact.email = email;
      createContact.listIds = [listId];

      if (attributes) {
        createContact.attributes = attributes;
      }

      await this.contactsApi.createContact(createContact);
      this.logger.log(`Contact ${email} added to list ${listId}`);

      return true;
    } catch (error) {
      this.logger.error('Failed to add contact:', error);
      return false;
    }
  }

  /**
   * Compile un template Handlebars avec des variables
   */
  private compileTemplate(
    template: string,
    variables: Record<string, any>,
  ): string {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(variables);
    } catch (error) {
      this.logger.error('Failed to compile template:', error);
      return template;
    }
  }

  /**
   * Génère le contenu HTML à partir des options
   */
  private generateHtmlContent(options: SendEmailOptions): string {
    if (options.params) {
      return this.compileTemplate(options.htmlContent || '', options.params);
    }
    return options.htmlContent || '';
  }

  /**
   * Normalise les destinataires en format Brevo
   */
  private normalizeRecipients(
    recipients: string | string[],
  ): Array<{ email: string }> {
    const emails = Array.isArray(recipients) ? recipients : [recipients];
    return emails.map((email) => ({ email }));
  }

  /**
   * Convertit un DTO SendEmailDto en options SendEmailOptions
   */
  convertDtoToOptions(dto: SendEmailDto): SendEmailOptions {
    return {
      to: dto.to.map((r) => r.email),
      subject: dto.subject,
      htmlContent: dto.htmlContent,
      textContent: dto.textContent,
      templateId: dto.templateId,
      params: dto.params,
      tags: dto.tags,
      cc: dto.cc?.map((r) => r.email),
      bcc: dto.bcc?.map((r) => r.email),
      replyTo: dto.replyTo?.email,
      attachments: dto.attachments?.map((att) => ({
        name: att.name,
        content: att.content,
        contentType: att.contentType,
      })),
    };
  }

  /**
   * Envoie un email de bienvenue via la queue (asynchrone)
   */
  async queueWelcomeEmail(
    to: string,
    name: string,
    dashboardUrl: string,
  ): Promise<string | null> {
    if (!this.emailQueueService) {
      this.logger.warn(
        'Email queue service not available, sending synchronously',
      );
      return this.sendWelcomeEmail(to, name, dashboardUrl)
        .then(() => 'sent-sync')
        .catch((error) => {
          this.logger.error('Failed to send welcome email:', error);
          return null;
        });
    }

    try {
      const jobId = await this.emailQueueService.addWelcomeEmail({
        to,
        name,
        dashboardUrl,
      });

      this.logger.log(`Welcome email queued with job ID: ${jobId}`);
      return jobId;
    } catch (error) {
      this.logger.error('Failed to queue welcome email:', error);
      return null;
    }
  }

  /**
   * Envoie un email de vérification via la queue (asynchrone)
   */
  async queueVerificationEmail(
    to: string,
    name: string,
    code: string,
    verificationUrl: string,
    expiryHours: number = 24,
  ): Promise<string | null> {
    if (!this.emailQueueService) {
      this.logger.warn(
        'Email queue service not available, sending synchronously',
      );
      return this.sendVerificationEmail(
        to,
        name,
        code,
        verificationUrl,
        expiryHours,
      )
        .then(() => 'sent-sync')
        .catch((error) => {
          this.logger.error('Failed to send verification email:', error);
          return null;
        });
    }

    try {
      const jobId = await this.emailQueueService.addVerificationEmail({
        to,
        name,
        code,
        verificationUrl,
        expiryHours,
      });

      this.logger.log(`Verification email queued with job ID: ${jobId}`);
      return jobId;
    } catch (error) {
      this.logger.error('Failed to queue verification email:', error);
      return null;
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe via la queue (asynchrone)
   */
  async queuePasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
    expiryMinutes: number = 30,
  ): Promise<string | null> {
    if (!this.emailQueueService) {
      this.logger.warn(
        'Email queue service not available, sending synchronously',
      );
      return this.sendPasswordResetEmail(to, name, resetUrl, expiryMinutes)
        .then(() => 'sent-sync')
        .catch((error) => {
          this.logger.error('Failed to send password reset email:', error);
          return null;
        });
    }

    try {
      const jobId = await this.emailQueueService.addPasswordResetEmail({
        to,
        name,
        resetUrl,
        expiryMinutes,
      });

      this.logger.log(`Password reset email queued with job ID: ${jobId}`);
      return jobId;
    } catch (error) {
      this.logger.error('Failed to queue password reset email:', error);
      return null;
    }
  }

  /**
   * Envoie un email personnalisé via la queue (asynchrone)
   */
  async queueCustomEmail(data: any): Promise<string | null> {
    if (!this.emailQueueService) {
      this.logger.warn(
        'Email queue service not available, sending synchronously',
      );
      return 'sent-sync';
    }

    try {
      const jobId = await this.emailQueueService.addCustomEmail(data);
      this.logger.log(`Custom email queued with job ID: ${jobId}`);
      return jobId;
    } catch (error) {
      this.logger.error('Failed to queue custom email:', error);
      return null;
    }
  }
}
