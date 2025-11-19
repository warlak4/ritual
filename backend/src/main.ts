import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Обрабатываем необработанные ошибки подключения к БД
  process.on('unhandledRejection', (reason, promise) => {
    if (reason && typeof reason === 'object' && 'code' in reason && reason.code === 'ESOCKET') {
      // Игнорируем ошибки подключения к БД, продолжаем работу
      console.warn('⚠️ Database connection error ignored, continuing without DB');
      return;
    }
    console.error('Unhandled Rejection:', reason);
  });

  try {
    const app = await NestFactory.create(AppModule, {
      // Не завершаем приложение при ошибках подключения к БД
      abortOnError: false,
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigins = configService.get<string[]>('app.corsOrigins');
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
  });

  app.use(helmet());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ритуаль API')
    .setDescription('Спецификация защищённой системы ритуальных услуг')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

    const port = configService.get<number>('app.port') ?? 3000;
    await app.listen(port);
    Logger.log(`Ритуаль API запущена на порту ${port}`, 'Bootstrap');
    Logger.log(`⚠️  Примечание: Если БД недоступна, некоторые функции могут не работать, но Telegram бот должен работать`, 'Bootstrap');
  } catch (error) {
    Logger.error('Ошибка при запуске приложения:', error);
    // Не завершаем процесс, даем возможность перезапустить
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  Logger.error('Критическая ошибка при bootstrap:', error);
  process.exit(1);
});
