import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
  constructor(
    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit() {
    // VerificationService будет установлен через метод setVerificationService
    // после инициализации всех модулей
  }
}

