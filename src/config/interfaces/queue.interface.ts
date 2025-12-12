export interface EmailJobData {
  type: EmailJobType;
  data: any;
  metadata?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    attempt?: number;
  };
}

export enum EmailJobType {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom',
}

export interface WelcomeEmailData {
  to: string;
  name: string;
  dashboardUrl: string;
}

export interface VerificationEmailData {
  to: string;
  name: string;
  code: string;
  verificationUrl: string;
  expiryHours?: number;
}

export interface PasswordResetEmailData {
  to: string;
  name: string;
  resetUrl: string;
  expiryMinutes?: number;
}

export interface CustomEmailData {
  to: string | string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, any>;
  attachments?: Array<{
    name: string;
    content: string; // Base64
    contentType: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  tags?: string[];
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface JobResult {
  success: boolean;
  jobId: string;
  messageId?: string;
  error?: string;
  duration: number;
}
