export const BREVO_CONFIG = {
  TEMPLATES: {
    WELCOME: 1,
    EMAIL_VERIFICATION: 2,
    PASSWORD_RESET: 3,
    ARCHITECTURE_SHARED: 4,
    NEW_COMMENT: 5,
    WEEKLY_DIGEST: 6,
  },
  // Tags pour le tracking
  TAGS: {
    TRANSACTIONAL: 'transactional',
    NOTIFICATION: 'notification',
    MARKETING: 'marketing',
    SECURITY: 'security',
  },
  // Configuration par défaut
  DEFAULT_SENDER: {
    name: 'Architect',
    email: 'noreply@architect.dev',
  },
  // Limites
  RATE_LIMIT: {
    PER_HOUR: 300,
    PER_DAY: 3000,
  },
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
} as const;

export const EMAIL_TEMPLATES_CONTENT = {
  WELCOME: {
    subject: 'Bienvenue sur Architect 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur Architect 🏗️</h1>
          </div>
          <div class="content">
            <h2>Bonjour {{name}},</h2>
            <p>Merci de vous être inscrit sur Architect, votre outil de documentation d'architecture préféré.</p>
            
            <p>Avec Architect, vous pouvez :</p>
            <ul>
              <li>📊 Créer des diagrammes techniques avec Mermaid</li>
              <li>🌳 Générer des arborescences de fichiers</li>
              <li>📝 Documenter vos choix d'architecture</li>
              <li>🔗 Partager vos architectures publiquement</li>
            </ul>
            
            <a href="{{dashboardUrl}}" class="button">Accéder à mon dashboard</a>
            
            <p>Besoin d'aide ? Consultez notre <a href="{{docsUrl}}">documentation</a>.</p>
            
            <p>Bonne construction,<br>L'équipe Architect</p>
          </div>
          <div class="footer">
            <p>© {{year}} Architect. Tous droits réservés.</p>
            <p>Vous recevez cet email car vous vous êtes inscrit sur Architect.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Bienvenue sur Architect 🎉
      
      Bonjour {{name}},
      
      Merci de vous être inscrit sur Architect, votre outil de documentation d'architecture préféré.
      
      Avec Architect, vous pouvez :
      - Créer des diagrammes techniques avec Mermaid
      - Générer des arborescences de fichiers
      - Documenter vos choix d'architecture
      - Partager vos architectures publiquement
      
      Accéder à votre dashboard : {{dashboardUrl}}
      
      Besoin d'aide ? Consultez notre documentation : {{docsUrl}}
      
      Bonne construction,
      L'équipe Architect
      
      © {{year}} Architect. Tous droits réservés.
      Vous recevez cet email car vous vous êtes inscrit sur Architect.
    `,
    variables: ['name', 'dashboardUrl', 'docsUrl', 'year'],
  },
  EMAIL_VERIFICATION: {
    subject: 'Vérifiez votre email - Architect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .code { font-family: monospace; font-size: 24px; letter-spacing: 5px; background: #eee; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Vérification d'email 🔐</h1>
          </div>
          <div class="content">
            <h2>Bonjour {{name}},</h2>
            <p>Merci de vous inscrire sur Architect. Pour compléter votre inscription, veuillez vérifier votre adresse email.</p>
            
            <p>Votre code de vérification :</p>
            <div class="code">{{code}}</div>
            
            <p>Ou cliquez sur le bouton ci-dessous :</p>
            <a href="{{verificationUrl}}" class="button">Vérifier mon email</a>
            
            <p>Ce lien expirera dans {{expiryHours}} heures.</p>
            
            <p>Si vous n'avez pas créé de compte Architect, vous pouvez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>© {{year}} Architect. Tous droits réservés.</p>
            <p>Cet email a été envoyé pour vérifier votre adresse email sur Architect.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Vérification d'email 🔐
      
      Bonjour {{name}},
      
      Merci de vous inscrire sur Architect. Pour compléter votre inscription, veuillez vérifier votre adresse email.
      
      Votre code de vérification : {{code}}
      
      Lien de vérification : {{verificationUrl}}
      
      Ce lien expirera dans {{expiryHours}} heures.
      
      Si vous n'avez pas créé de compte Architect, vous pouvez ignorer cet email.
      
      © {{year}} Architect. Tous droits réservés.
      Cet email a été envoyé pour vérifier votre adresse email sur Architect.
    `,
    variables: ['name', 'code', 'verificationUrl', 'expiryHours', 'year'],
  },
  PASSWORD_RESET: {
    subject: 'Réinitialisation de votre mot de passe - Architect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe 🔑</h1>
          </div>
          <div class="content">
            <h2>Bonjour {{name}},</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe Architect.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <a href="{{resetUrl}}" class="button">Réinitialiser mon mot de passe</a>
            
            <div class="warning">
              <p><strong>⚠️ Important :</strong></p>
              <p>Ce lien est valable pendant {{expiryMinutes}} minutes seulement.</p>
              <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
            </div>
            
            <p>Pour des raisons de sécurité, ne partagez jamais ce lien.</p>
          </div>
          <div class="footer">
            <p>© {{year}} Architect. Tous droits réservés.</p>
            <p>Cet email a été envoyé suite à une demande de réinitialisation de mot de passe.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Réinitialisation de mot de passe 🔑
      
      Bonjour {{name}},
      
      Vous avez demandé à réinitialiser votre mot de passe Architect.
      
      Lien de réinitialisation : {{resetUrl}}
      
      ⚠️ Important :
      Ce lien est valable pendant {{expiryMinutes}} minutes seulement.
      Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
      
      Pour des raisons de sécurité, ne partagez jamais ce lien.
      
      © {{year}} Architect. Tous droits réservés.
      Cet email a été envoyé suite à une demande de réinitialisation de mot de passe.
    `,
    variables: ['name', 'resetUrl', 'expiryMinutes', 'year'],
  },
};
