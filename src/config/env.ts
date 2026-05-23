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
  databaseUrl: env('DATABASE_URL', 'file:./dev.db'),
  isDev: env('NODE_ENV', 'development') === 'development',
} as const;
