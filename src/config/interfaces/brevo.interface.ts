export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

export interface EmailAttachment {
  name: string;
  content: string;
  contentType: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  templateId?: number;
  params?: Record<string, any>;
  textContent?: string;
  htmlContent?: string;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  tags?: string[];
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | Date;
}

export interface BrevoSendResponse {
  accepted: string[];
  rejected: string[];
  response?: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SendSmtpEmail {
  sender?: { name: string; email: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: { [key: string]: string };
  tags?: string[];
  replyTo?: { email: string; name?: string };
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  attachment?: Array<{
    name: string;
    content: string;
    contentType: string;
  }>;
}
