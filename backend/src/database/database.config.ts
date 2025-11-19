import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';

export function typeOrmModuleFactory(configService: ConfigService): TypeOrmModuleOptions {
  const dbConfig = configService.get<{
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    encrypt: boolean;
    trustServerCertificate: boolean;
    logging: boolean;
  }>('app.database');

  if (!dbConfig) {
    throw new Error('Database configuration is missing');
  }

  return {
    type: 'mssql',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    options: {
      encrypt: dbConfig.encrypt,
      trustServerCertificate: dbConfig.trustServerCertificate,
      connectTimeout: 3000, // Таймаут подключения 3 секунды
      requestTimeout: 3000, // Таймаут запроса 3 секунды
    },
    logging: dbConfig.logging,
    entities,
    synchronize: false,
    migrationsRun: false,
    retryAttempts: 0, // Не пытаемся переподключаться, чтобы не блокировать запуск
    retryDelay: 0,
    autoLoadEntities: true,
    // Не блокируем запуск приложения при ошибке подключения
    // Приложение должно работать даже если БД недоступна
  } as TypeOrmModuleOptions;
}

export function createDataSourceOptions(config: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
  logging: boolean;
}): DataSourceOptions {
  return {
    type: 'mssql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
    },
    logging: config.logging,
    entities,
    migrations: ['dist/src/database/migrations/*.js'],
  };
}

