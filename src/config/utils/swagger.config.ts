import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AuthUserResponse } from 'src/common/dto/swagger.dto';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('🏗️ Architect API')
    .setDescription(
      `
# Architect - API Documentation

## 📋 Description
SaaS application for developers to create, document and share technical architectures.

## 🔐 Authentication
This API uses JWT tokens for authentication. Two methods are available:

### 1. Bearer Token (Recommended for API clients)
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### 2. HTTP-only Cookies (Recommended for web browsers)
Cookies are automatically managed by the browser:
- \`access_token\`: JWT access token
- \`refresh_token\`: JWT refresh token
- \`session_active\`: Session status flag

## 📝 Response Format
All responses follow the same format:
\`\`\`json
{
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
\`\`\`

## ⚠️ Error Format
Errors also follow a standardized format:
\`\`\`json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error Type",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/endpoint"
}
\`\`\`

## 🚀 Version: 1.0.0
    `,
    )
    .setVersion('1.0.0')
    .setContact(
      'Architect Team',
      'https://github.com/yourusername/architect',
      'contact@architect.dev',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'HTTP-only cookie containing JWT access token',
    })
    .addTag(
      '🔐 Authentication',
      'User registration, login, and session management',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
    extraModels: [AuthUserResponse],
  });

  // Save OpenAPI spec for external tools
  if (process.env.NODE_ENV !== 'production') {
    const outputPath = join(process.cwd(), 'openapi-spec.json');
    writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`📄 OpenAPI specification saved to: ${outputPath}`);
  }

  // Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      operationsSorter: 'method',
      tagsSorter: 'alpha',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      authAction: {
        'JWT-auth': {
          name: 'JWT-auth',
          schema: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          value: 'Bearer <your-jwt-token>',
        },
      },
    },
    customSiteTitle: '🏗️ Architect API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .swagger-ui .topbar-wrapper img {
        content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="48" height="48"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>');
        height: 40px;
      }
      .swagger-ui .info { 
        margin: 30px 0;
        padding: 25px;
        background: #f8f9fa;
        border-radius: 10px;
        border-left: 5px solid #667eea;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      }
      .swagger-ui .info .title {
        color: #2d3748;
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 10px;
      }
      .swagger-ui .info .description {
        color: #4a5568;
        font-size: 16px;
        line-height: 1.6;
      }
      .swagger-ui .opblock-tag {
        font-size: 20px;
        font-weight: 700;
        padding: 15px 0;
        margin: 20px 0;
        border-bottom: 3px solid #e2e8f0;
        color: #2d3748;
      }
      .swagger-ui .opblock {
        border-radius: 10px;
        margin: 15px 0;
        box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
      }
      .swagger-ui .opblock:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0,0,0,0.12);
      }
      .swagger-ui .opblock.opblock-post {
        border-left: 4px solid #48bb78;
      }
      .swagger-ui .opblock.opblock-get {
        border-left: 4px solid #4299e1;
      }
      .swagger-ui .opblock.opblock-put {
        border-left: 4px solid #ed8936;
      }
      .swagger-ui .opblock.opblock-delete {
        border-left: 4px solid #f56565;
      }
      .swagger-ui .btn.authorize {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        border-radius: 6px;
        padding: 8px 20px;
        font-weight: 600;
        transition: all 0.3s ease;
      }
      .swagger-ui .btn.authorize:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }
      .swagger-ui .response-col_status {
        font-weight: 700;
        font-size: 14px;
        padding: 5px 10px;
        border-radius: 4px;
      }
      .swagger-ui .response-col_status[data-code^="2"] {
        background-color: #c6f6d5;
        color: #22543d;
      }
      .swagger-ui .response-col_status[data-code^="4"] {
        background-color: #fed7d7;
        color: #742a2a;
      }
      .swagger-ui .response-col_status[data-code^="5"] {
        background-color: #feebc8;
        color: #744210;
      }
      .swagger-ui .markdown code {
        background: #edf2f7;
        padding: 3px 8px;
        border-radius: 4px;
        color: #2d3748;
        font-family: 'Courier New', monospace;
        font-size: 14px;
      }
      .scheme-container {
        background: #f7fafc;
        padding: 20px;
        border-radius: 8px;
        margin: 25px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      }
    `,
  });
}
