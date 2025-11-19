import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRef } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { ClientsModule } from '../clients/clients.module';
import { TelegramModule } from '../telegram/telegram.module';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from './auth.service';
import { VerificationService } from './verification.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { UserEntity } from '../../database/entities';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersModule,
    ClientsModule,
    forwardRef(() => TelegramModule),
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const jwt = configService.get('app.jwt');
        return {
          secret: jwt.secret,
          signOptions: {
            expiresIn: jwt.accessTokenTtl,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, VerificationService, LocalStrategy, JwtStrategy, RefreshStrategy, JwtAuthGuard, RefreshAuthGuard],
  exports: [AuthService, VerificationService, JwtAuthGuard],
})
export class AuthModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly verificationService: VerificationService,
  ) {}

  async onModuleInit() {
    // Устанавливаем VerificationService в TelegramService после инициализации
    // Используем setTimeout для задержки, чтобы все модули успели инициализироваться
    setTimeout(() => {
      try {
        const telegramService = this.moduleRef.get(TelegramService, { strict: false });
        if (telegramService) {
          telegramService.setVerificationService(this.verificationService);
          console.log('✅ VerificationService установлен в TelegramService');
        }
      } catch (error) {
        console.warn('⚠️ Не удалось установить VerificationService в TelegramService:', error);
      }
    }, 2000); // Задержка 2 секунды для инициализации всех модулей
  }
}

