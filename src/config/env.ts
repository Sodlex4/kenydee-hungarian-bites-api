import 'dotenv/config';

function env(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? parseInt(v, 10) : fallback;
}

export const config = {
  port: envInt('PORT', 3000),
  nodeEnv: env('NODE_ENV', 'development'),
  jwtSecret: env('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: env('JWT_EXPIRES_IN', '7d'),
  whatsappNumber: env('WHATSAPP_NUMBER', '254759233065'),
  corsOrigins: env('CORS_ORIGINS', 'http://localhost:8080').split(','),
  dbHost: env('DB_HOST', '127.0.0.1'),
  dbPort: envInt('DB_PORT', 3306),
  dbUser: env('DB_USER', 'root'),
  dbPassword: env('DB_PASSWORD', ''),
  dbName: env('DB_NAME', 'hungarian_bites'),
  smtpHost: env('SMTP_HOST', ''),
  smtpPort: envInt('SMTP_PORT', 587),
  smtpUser: env('SMTP_USER', ''),
  smtpPass: env('SMTP_PASS', ''),
  emailFrom: env('EMAIL_FROM', ''),
  isDev: env('NODE_ENV', 'development') === 'development',
} as const;
