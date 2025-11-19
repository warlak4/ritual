import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((v) => v.trim()).filter(Boolean),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'changeme',
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  database: {
    host: process.env.DB_HOST ?? 'sqlserver',
    port: parseInt(process.env.DB_PORT ?? '1433', 10),
    username: process.env.DB_USER ?? 'sa',
    password: process.env.DB_PASSWORD ?? 'YourStrong!Passw0rd',
    database: process.env.DB_NAME ?? 'RitualDB',
    encrypt: (process.env.DB_ENCRYPT ?? 'true') === 'true',
    trustServerCertificate: (process.env.DB_TRUST_CERT ?? 'true') === 'true',
    logging: (process.env.DB_LOGGING ?? 'false') === 'true',
    schema: process.env.DB_SCHEMA ?? 'domain',
  },
  crypto: {
    masterKey: process.env.CRYPTO_MASTER_KEY ?? '0123456789abcdef0123456789abcdef',
  },
  rateLimit: {
    points: parseInt(process.env.RATE_LIMIT_POINTS ?? '200', 10),
    duration: parseInt(process.env.RATE_LIMIT_DURATION ?? '60', 10),
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    chatId: process.env.TELEGRAM_CHAT_ID ?? '',
  },
}));

