import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validateEnv } from './config/environment.validation';
import { typeOrmModuleFactory } from './database/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CeremoniesModule } from './modules/ceremonies/ceremonies.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rate = configService.get('app.rateLimit');
        return [
          {
            ttl: rate.duration,
            limit: rate.points,
          },
        ];
      },
    }),
    // Подключение к БД - опционально, не блокирует запуск приложения
    // Используем conditional import или просто пропускаем, если БД недоступна
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = typeOrmModuleFactory(configService);
        // Устанавливаем retryAttempts в 0, чтобы не блокировать запуск
        return {
          ...dbConfig,
          retryAttempts: 0, // Не пытаемся переподключаться
          retryDelay: 0,
        };
      },
      // Не блокируем запуск при ошибке
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    CatalogModule,
    OrdersModule,
    CeremoniesModule,
    ResourcesModule,
    PaymentsModule,
    AnalyticsModule,
    SettingsModule,
    TelegramModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
