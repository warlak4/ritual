import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { VerificationService } from '../auth/verification.service';
import { UsersService } from '../users/users.service';
import PDFDocument from 'pdfkit';

interface UserSession {
  phone: string;
  chatId: number;
  registered: boolean;
}

export interface CartData {
  items: Array<{ id: string; name: string; type: string; quantity: number; price: number; currency: string }>;
  total: number;
  currency: string;
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot | null = null;
  private userSessions = new Map<number, UserSession>(); // chatId -> UserSession
  private phoneToChatId = new Map<string, number>(); // phone -> chatId
  private userCarts = new Map<string, CartData>(); // phone -> CartData
  private receiptStorage = new Map<string, { pdfBuffer: Buffer; cart: CartData; clientPhone: string; timestamp: Date }>(); // receiptId -> receipt data

  private verificationService: VerificationService | null = null;
  
  // Номер телефона менеджера
  private readonly MANAGER_PHONE = '+79898181005';

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}
  
  setVerificationService(service: VerificationService) {
    this.verificationService = service;
  }

  async onModuleInit() {
    const token = this.configService.get<string>('app.telegram.botToken');
    const chatId = this.configService.get<string>('app.telegram.chatId');

    if (!token) {
      this.logger.warn('Telegram bot token not configured. Telegram bot will be disabled.');
      return;
    }
    
    if (!chatId) {
      this.logger.warn('⚠️ TELEGRAM_CHAT_ID not configured. Manager notifications will not be sent.');
    } else {
      this.logger.log(`✅ Manager chat ID configured: ${chatId}`);
    }

    try {
      this.logger.log(`Initializing Telegram bot with token: ${token.substring(0, 10)}...`);
      
      this.bot = new TelegramBot(token, { 
        polling: {
          interval: 100,
          autoStart: true,
          params: {
            timeout: 10,
            limit: 1,
            allowed_updates: ['message', 'callback_query']
          }
        }
      });
      
      this.setupHandlers();
      
      const me = await this.bot.getMe();
      this.logger.log(`✅ Bot connected: @${me.username} (${me.first_name})`);
      this.logger.log('✅ Telegram bot initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Telegram bot', error);
      if (error instanceof Error) {
        this.logger.error(`Error details: ${error.message}`);
        if (error.stack) {
          this.logger.error(`Stack: ${error.stack}`);
        }
      }
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      await this.bot.stopPolling();
      this.logger.log('Telegram bot polling stopped');
    }
  }

  private setupHandlers() {
    if (!this.bot) {
      this.logger.error('Bot is null, cannot setup handlers');
      return;
    }

    this.logger.log('Setting up Telegram bot handlers...');

    this.bot.on('polling_error', (error) => {
      this.logger.error(`❌ Telegram polling error: ${error.message}`);
    });

    this.bot.on('error', (error) => {
      this.logger.error(`❌ Telegram bot error: ${error.message}`);
    });

    // Обработчик команды /start
    this.bot.onText(/\/start/, async (msg) => {
      try {
        const chatId = msg.chat.id;
        const session = this.userSessions.get(chatId);

        if (session && session.registered) {
          // Пользователь уже зарегистрирован, показываем меню
          await this.showMainMenu(chatId);
          return;
        }

        // Показываем кнопку для запроса контакта
        await this.bot!.sendMessage(
          chatId,
          '👋 Добро пожаловать!\n\n' +
            'Для работы с ботом необходимо предоставить доступ к информации аккаунта, чтобы получить ваш номер телефона.',
          {
            reply_markup: {
              keyboard: [[{
                text: '📱 Предоставить номер телефона',
                request_contact: true
              }]],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }
        );
      } catch (error) {
        this.logger.error(`Error handling /start: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Обработчик получения контакта
    this.bot.on('message', async (msg) => {
      if (msg.text?.startsWith('/')) {
        return;
      }

      try {
        const chatId = msg.chat.id;

        // Проверяем, есть ли контакт в сообщении
        if (msg.contact) {
          await this.handleContact(chatId, msg.contact.phone_number);
          return;
        }

        // Если пользователь уже зарегистрирован, игнорируем текстовые сообщения
        const session = this.userSessions.get(chatId);
        if (session && session.registered) {
          await this.bot!.sendMessage(
            chatId,
            'Используйте кнопки меню для навигации.',
            { reply_markup: { remove_keyboard: true } }
          );
          await this.showMainMenu(chatId);
          return;
        }
      } catch (error) {
        this.logger.error(`Error handling message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Обработчик callback_query (нажатия на inline-кнопки)
    this.bot.on('callback_query', async (query) => {
      try {
        const chatId = query.message?.chat.id;
        if (!chatId) {
          return;
        }

        const session = this.userSessions.get(chatId);
        if (!session || !session.registered) {
          await this.bot!.answerCallbackQuery(query.id, {
            text: 'Сначала предоставьте номер телефона через /start',
            show_alert: true
          });
          return;
        }

        const data = query.data;
        await this.bot!.answerCallbackQuery(query.id);

        if (!data) {
          this.logger.warn('Callback query without data');
          return;
        }

        if (data === 'cart') {
          await this.showCart(chatId, session.phone);
        } else if (data === 'profile') {
          await this.showProfile(chatId, session.phone);
        } else if (data === 'pay') {
          await this.handlePayment(chatId, session.phone);
        } else if (data === 'menu') {
          await this.showMainMenu(chatId);
        } else if (data.startsWith('forward_receipt_')) {
          // Обработка пересылки чека покупателю
          const clientPhone = data.replace('forward_receipt_', '');
          await this.forwardReceiptToClient(chatId, session.phone, clientPhone);
        }
      } catch (error) {
        this.logger.error(`Error handling callback: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    this.logger.log('✅ Telegram bot handlers setup complete');
  }

  private async handleContact(chatId: number, phoneNumber: string) {
    try {
      const normalizedPhone = this.normalizePhone(phoneNumber);
      
      this.logger.log(`📞 Received contact from chat ${chatId}: ${phoneNumber} -> normalized: ${normalizedPhone}`);

      // Сохраняем сессию пользователя
      const session: UserSession = {
        phone: normalizedPhone,
        chatId,
        registered: true
      };
      this.userSessions.set(chatId, session);
      this.phoneToChatId.set(normalizedPhone, chatId);

      // Получаем код для регистрации
      if (!this.verificationService) {
        this.logger.warn('⚠️ VerificationService is not initialized');
        await this.bot!.sendMessage(chatId, '❌ Сервис верификации не инициализирован.');
        await this.showMainMenu(chatId);
        return;
      }

      this.logger.log(`🔍 Checking for verification code for phone: ${normalizedPhone}`);
      const code = this.verificationService.getCodeByPhone(normalizedPhone);
      
      if (code) {
        this.logger.log(`✅ Found verification code for phone ${normalizedPhone}: ${code}`);
        await this.bot!.sendMessage(
          chatId,
          `✅ Ваш номер телефона получен: ${normalizedPhone}\n\n` +
            `🔐 *Код подтверждения для регистрации:*\n\n` +
            `**${code}**\n\n` +
            `Используйте этот код на сайте для завершения регистрации.\n` +
            `Код действителен 10 минут.`,
          { parse_mode: 'Markdown' }
        );
      } else {
        this.logger.log(`⚠️ No verification code found for phone ${normalizedPhone}`);
        // Проверяем все возможные варианты нормализации
        const alternativePhones = [
          normalizedPhone,
          normalizedPhone.startsWith('+') ? normalizedPhone.substring(1) : `+${normalizedPhone}`,
          normalizedPhone.replace('+', ''),
          normalizedPhone.startsWith('+7') ? '7' + normalizedPhone.substring(2) : normalizedPhone,
          normalizedPhone.startsWith('7') && !normalizedPhone.startsWith('+7') ? '+7' + normalizedPhone.substring(1) : normalizedPhone,
        ];
        
        // Убираем дубликаты
        const uniquePhones = Array.from(new Set(alternativePhones));
        this.logger.log(`🔍 Trying alternative phone formats: ${uniquePhones.join(', ')}`);
        
        let foundCode: string | null = null;
        let foundPhone: string | null = null;
        for (const altPhone of uniquePhones) {
          if (altPhone === normalizedPhone) continue; // Уже проверили
          const altCode = this.verificationService.getCodeByPhone(altPhone);
          if (altCode) {
            foundCode = altCode;
            foundPhone = altPhone;
            this.logger.log(`✅ Found code with alternative phone format: ${altPhone} -> ${altCode}`);
            break;
          }
        }
        
        if (foundCode) {
          await this.bot!.sendMessage(
            chatId,
            `✅ Ваш номер телефона получен: ${normalizedPhone}\n\n` +
              `🔐 *Код подтверждения для регистрации:*\n\n` +
              `**${foundCode}**\n\n` +
              `Используйте этот код на сайте для завершения регистрации.\n` +
              `Код действителен 10 минут.`,
            { parse_mode: 'Markdown' }
          );
        } else {
          this.logger.warn(`❌ No verification code found for any phone format. Normalized: ${normalizedPhone}, tried: ${uniquePhones.join(', ')}`);
          await this.bot!.sendMessage(
            chatId,
            `✅ Ваш номер телефона получен: ${normalizedPhone}\n\n` +
              `⚠️ Код регистрации не найден или истек.\n\n` +
              `Для получения кода регистрации:\n` +
              `1. Перейдите на сайт\n` +
              `2. Заполните форму регистрации\n` +
              `3. Нажмите "Запросить код"\n` +
              `4. Затем вернитесь в бота и предоставьте номер телефона`
          );
        }
      }

      // Показываем главное меню
      await this.showMainMenu(chatId);
    } catch (error) {
      this.logger.error(`❌ Error handling contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.error(`Stack: ${error.stack}`);
      }
    }
  }

  private async showMainMenu(chatId: number) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '🛒 Посмотреть корзину', callback_data: 'cart' }],
        [{ text: '👤 Профиль', callback_data: 'profile' }],
        [{ text: '💳 Оплатить корзину', callback_data: 'pay' }],
      ]
    };

    await this.bot!.sendMessage(
      chatId,
      '📋 *Главное меню*\n\nВыберите действие:',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
  }

  private async showCart(chatId: number, phone: string) {
    const cart = this.userCarts.get(phone);
    
    if (!cart || cart.items.length === 0) {
      await this.bot!.sendMessage(
        chatId,
        '🛒 *Корзина пуста*\n\nДобавьте товары на сайте, чтобы увидеть их здесь.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
          }
        }
      );
      return;
    }

    const itemsText = cart.items
      .map((item, index) => {
        const itemTotal = item.price * item.quantity;
        return `${index + 1}. *${item.name}*\n   Тип: ${item.type === 'package' ? 'Пакет' : 'Услуга'}\n   Количество: ${item.quantity}\n   Цена: ${item.price.toFixed(2)} ${item.currency}\n   Итого: ${itemTotal.toFixed(2)} ${item.currency}`;
      })
      .join('\n\n');

    const message = `🛒 *Ваша корзина*\n\n${itemsText}\n\n` +
      `💰 *Общая сумма: ${cart.total.toFixed(2)} ${cart.currency}*`;

    await this.bot!.sendMessage(
      chatId,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Оплатить', callback_data: 'pay' }],
            [{ text: '◀️ Назад в меню', callback_data: 'menu' }]
          ]
        }
      }
    );
  }

  private async showProfile(chatId: number, phone: string) {
    // Здесь можно получить информацию о пользователе из базы данных
    // Пока показываем только телефон
    await this.bot!.sendMessage(
      chatId,
      `👤 *Ваш профиль*\n\n` +
        `📱 Телефон: ${phone}\n\n` +
        `Для изменения данных перейдите на сайт.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
        }
      }
    );
  }

  private async handlePayment(chatId: number, phone: string) {
    const cart = this.userCarts.get(phone);
    
    if (!cart || cart.items.length === 0) {
      await this.bot!.sendMessage(
        chatId,
        '❌ Корзина пуста. Нечего оплачивать.',
        {
          reply_markup: {
            inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
          }
        }
      );
      return;
    }

    // Отправляем PDF чек менеджеру
    const chatIdForManager = this.configService.get<string>('app.telegram.chatId');
    this.logger.log(`🔍 [handlePayment] Manager chat ID from config: ${chatIdForManager || 'NOT SET'}`);
    this.logger.log(`🔍 [handlePayment] Client phone: ${phone}, chatId: ${chatId}`);
    
    if (chatIdForManager) {
      try {
        this.logger.log(`📄 [handlePayment] Generating PDF receipt for manager...`);
        const pdfBuffer = await this.generateReceiptPDF(cart, phone);
        this.logger.log(`✅ [handlePayment] PDF generated, size: ${pdfBuffer.length} bytes`);
        
        this.logger.log(`🔍 [handlePayment] Resolving manager chat ID from: ${chatIdForManager}`);
        const managerChatId = await this.resolveManagerChatId(chatIdForManager);
        
        if (!managerChatId) {
          this.logger.error(`❌ [handlePayment] Could not resolve manager chat ID from: ${chatIdForManager}`);
          // Не прерываем выполнение, просто логируем ошибку
        } else {
          this.logger.log(`📤 [handlePayment] Sending PDF to manager chat ID: ${managerChatId}`);
          
          try {
            // Сохраняем чек для возможности пересылки (используем номер телефона клиента как ключ)
            const receiptKey = `receipt_${this.normalizePhone(phone)}_${Date.now()}`;
            this.receiptStorage.set(receiptKey, {
              pdfBuffer,
              cart,
              clientPhone: phone,
              timestamp: new Date()
            });
            this.logger.log(`💾 [handlePayment] Receipt saved with key: ${receiptKey}`);
            
            // Формируем клавиатуру с кнопкой пересылки для менеджера
            const replyMarkup = {
              inline_keyboard: [[
                { text: '📤 Переслать покупателю', callback_data: `forward_receipt_${this.normalizePhone(phone)}` }
              ]]
            };
            
            this.logger.log(`📤 [handlePayment] Attempting to send document to manager...`);
            // Используем Buffer напрямую, filename можно указать через опции (типы могут быть неполными)
            await this.bot!.sendDocument(
              managerChatId,
              pdfBuffer,
              {
                caption: `💳 *Чек об оплате*\n\n` +
                  `📱 Телефон клиента: ${phone}\n` +
                  `💰 Общая сумма: ${cart.total.toFixed(2)} ${cart.currency}\n` +
                  `⏰ Время: ${new Date().toLocaleString('ru-RU')}`,
                parse_mode: 'Markdown',
                reply_markup: replyMarkup,
                filename: `receipt_${phone}_${Date.now()}.pdf`
              } as any
            );
            
            this.logger.log(`✅ [handlePayment] PDF receipt sent successfully to manager (chatId: ${managerChatId}) for phone: ${phone}`);
          } catch (sendError) {
            this.logger.error(`❌ [handlePayment] Error sending PDF document: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`);
            if (sendError instanceof Error && (sendError as any).response) {
              this.logger.error(`[handlePayment] Telegram API response: ${JSON.stringify((sendError as any).response.body, null, 2)}`);
            }
            
            // Fallback: отправляем текстовое сообщение если PDF не удалось отправить
            try {
              this.logger.log(`📤 [handlePayment] Trying fallback text message to manager...`);
              const itemsText = cart.items
                .map((item, index) => {
                  const itemTotal = item.price * item.quantity;
                  return `${index + 1}. ${item.name} (${item.type === 'package' ? 'Пакет' : 'Услуга'})\n   Количество: ${item.quantity}\n   Цена: ${item.price.toFixed(2)} ${cart.currency}\n   Итого: ${itemTotal.toFixed(2)} ${cart.currency}`;
                })
                .join('\n\n');

              const message = `💳 *Запрос на оплату*\n\n` +
                `📱 Телефон клиента: ${phone}\n\n` +
                `📦 *Состав заказа:*\n${itemsText}\n\n` +
                `💰 *Общая сумма: ${cart.total.toFixed(2)} ${cart.currency}*\n\n` +
                `⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

              await this.bot!.sendMessage(managerChatId, message, { parse_mode: 'Markdown' });
              this.logger.log(`✅ [handlePayment] Fallback text message sent to manager (chatId: ${managerChatId})`);
            } catch (fallbackError) {
              this.logger.error(`❌ [handlePayment] Failed to send fallback message: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
            }
          }
        }
        
        // Уведомляем админов и менеджеров о платеже
        await this.notifyAdminsAndManagersAboutPayment(cart, phone);
      } catch (error) {
        this.logger.error(`❌ [handlePayment] Failed to generate or send PDF receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (error instanceof Error && error.stack) {
          this.logger.error(`[handlePayment] Stack trace: ${error.stack}`);
        }
      }
    } else {
      this.logger.warn('⚠️ [handlePayment] TELEGRAM_CHAT_ID not configured, skipping manager notification');
    }

    // ВСЕГДА отправляем сообщение клиенту, даже если была ошибка с менеджером
    this.logger.log(`📤 [handlePayment] Sending confirmation message to client (chatId: ${chatId})...`);
    try {
      await this.bot!.sendMessage(
        chatId,
        `✅ Успешно оплачено!\n\n` +
          `Ожидайте чек. Менеджер отправит вам чек в ближайшее время.`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
          }
        }
      );
      this.logger.log(`✅ [handlePayment] Confirmation message sent to client successfully`);
    } catch (clientMessageError) {
      this.logger.error(`❌ [handlePayment] Failed to send confirmation to client: ${clientMessageError instanceof Error ? clientMessageError.message : 'Unknown error'}`);
    }
  }

  private async generateReceiptPDF(cart: CartData, phone: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Для поддержки кириллицы используем кастомный шрифт DejaVu Sans
        // Стандартные шрифты PDFKit не поддерживают кириллицу
        const path = require('path');
        const fs = require('fs');
        
        // Пытаемся загрузить кастомный шрифт с поддержкой кириллицы
        // Путь должен работать как в dev (src/assets), так и в production (dist/assets)
        const fontPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'DejaVuSans.ttf');
        const fontBoldPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'DejaVuSans-Bold.ttf');
        
        // Если не найден в src, пробуем dist (для production)
        const fontPathDist = path.join(process.cwd(), 'dist', 'assets', 'fonts', 'DejaVuSans.ttf');
        const fontBoldPathDist = path.join(process.cwd(), 'dist', 'assets', 'fonts', 'DejaVuSans-Bold.ttf');
        
        const finalFontPath = fs.existsSync(fontPath) ? fontPath : fontPathDist;
        const finalFontBoldPath = fs.existsSync(fontBoldPath) ? fontBoldPath : fontBoldPathDist;
        
        let font = 'Courier';
        let fontBold = 'Courier-Bold';
        
        if (fs.existsSync(finalFontPath)) {
          try {
            const stats = fs.statSync(finalFontPath);
            if (stats.size > 1000) { // Проверяем, что файл не пустой
              doc.registerFont('DejaVuSans', finalFontPath);
              font = 'DejaVuSans';
              this.logger.log(`✅ Используется шрифт DejaVuSans для поддержки кириллицы (${(stats.size / 1024).toFixed(2)} KB)`);
            } else {
              this.logger.warn('⚠️ Файл DejaVuSans.ttf слишком маленький, возможно поврежден');
            }
          } catch (fontError) {
            this.logger.warn(`⚠️ Не удалось загрузить шрифт: ${fontError instanceof Error ? fontError.message : 'Unknown error'}`);
          }
        } else {
          this.logger.warn('⚠️ Шрифт DejaVuSans.ttf не найден. Кириллица может отображаться некорректно.');
          this.logger.warn('   Для исправления запустите: node scripts/install-fonts.js');
        }
        
        if (fs.existsSync(finalFontBoldPath)) {
          try {
            const stats = fs.statSync(finalFontBoldPath);
            if (stats.size > 1000) { // Проверяем, что файл не пустой
              doc.registerFont('DejaVuSans-Bold', finalFontBoldPath);
              fontBold = 'DejaVuSans-Bold';
              this.logger.log(`✅ Используется шрифт DejaVuSans-Bold для поддержки кириллицы (${(stats.size / 1024).toFixed(2)} KB)`);
            } else {
              this.logger.warn('⚠️ Файл DejaVuSans-Bold.ttf слишком маленький, возможно поврежден');
              fontBold = font; // Используем обычный шрифт если Bold не загружен
            }
          } catch (fontError) {
            this.logger.warn(`⚠️ Не удалось загрузить жирный шрифт: ${fontError instanceof Error ? fontError.message : 'Unknown error'}`);
            fontBold = font; // Используем обычный шрифт если Bold не загружен
          }
        } else {
          this.logger.warn('⚠️ Файл DejaVuSans-Bold.ttf не найден, используем обычный шрифт');
          fontBold = font; // Используем обычный шрифт если Bold не найден
        }

        // Заголовок
        doc.font(fontBold)
          .fontSize(24)
          .text('ЧЕК ОБ ОПЛАТЕ', { align: 'center' })
          .moveDown();

        // Статус оплаты
        doc.fontSize(18)
          .fillColor('green')
          .text('ОПЛАЧЕНО', { align: 'center' })
          .fillColor('black')
          .moveDown(2);

        // Информация о клиенте
        doc.font(font)
          .fontSize(12)
          .text(`Телефон клиента: ${phone}`, { align: 'left' })
          .text(`Дата и время: ${new Date().toLocaleString('ru-RU')}`, { align: 'left' })
          .moveDown();

        // Разделитель
        doc.moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown();

        // Товары
        doc.fontSize(14)
          .text('Состав заказа:', { align: 'left' })
          .moveDown(0.5);

        cart.items.forEach((item, index) => {
          const itemTotal = item.price * item.quantity;
          
          doc.fontSize(12)
            .text(`${index + 1}. ${item.name}`, { align: 'left' })
            .fontSize(10)
            .text(`   Тип: ${item.type === 'package' ? 'Пакет' : 'Услуга'}`, { align: 'left' })
            .text(`   Количество: ${item.quantity}`, { align: 'left' })
            .text(`   Цена за единицу: ${item.price.toFixed(2)} ${cart.currency}`, { align: 'left' })
            .text(`   Итого: ${itemTotal.toFixed(2)} ${cart.currency}`, { align: 'left' })
            .moveDown();
        });

        // Разделитель
        doc.moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown();

        // Итоговая сумма
        doc.fontSize(16)
          .font(fontBold)
          .text(`Общая сумма: ${cart.total.toFixed(2)} ${cart.currency}`, { align: 'right' })
          .moveDown(2);

        // Подпись
        doc.fontSize(10)
          .font(font)
          .fillColor('gray')
          .text('Спасибо за ваш заказ!', { align: 'center' })
          .moveDown()
          .text(`Чек сгенерирован: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async saveUserCart(phone: string, cartData: CartData) {
    const normalizedPhone = this.normalizePhone(phone);
    this.userCarts.set(normalizedPhone, cartData);
    this.logger.log(`Cart saved for phone: ${normalizedPhone}`);
  }

  async sendOrderNotification(phone: string, orderDetails: {
    items: Array<{ name: string; type: string; quantity: number; price: number }>;
    total: number;
    currency: string;
    userName?: string;
  }): Promise<{ success: boolean; message?: string }> {
    if (!this.bot) {
      this.logger.error('Bot is not initialized, cannot send order notification');
      return { success: false, message: 'Bot is not initialized' };
    }

    const normalizedPhone = this.normalizePhone(phone);
    
    // Сохраняем корзину для пользователя
    await this.saveUserCart(normalizedPhone, {
      items: orderDetails.items.map((item) => ({
        id: item.name,
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        currency: orderDetails.currency,
      })),
      total: orderDetails.total,
      currency: orderDetails.currency,
    });

    // Отправляем уведомление пользователю в боте, если он зарегистрирован
    const chatId = this.phoneToChatId.get(normalizedPhone);
    if (chatId) {
      try {
        await this.bot.sendMessage(
          chatId,
          `🛒 *Новый заказ оформлен*\n\n` +
            `Вы можете посмотреть детали заказа и оплатить его через меню бота.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🛒 Посмотреть корзину', callback_data: 'cart' }],
                [{ text: '💳 Оплатить', callback_data: 'pay' }]
              ]
            }
          }
        );
      } catch (error) {
        this.logger.warn(`Could not send notification to user chat ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Отправляем уведомление менеджеру
    const managerChatIdConfig = this.configService.get<string>('app.telegram.chatId');
    this.logger.log(`🔍 Manager chat ID from config (sendOrderNotification): ${managerChatIdConfig || 'NOT SET'}`);
    
    if (managerChatIdConfig) {
      try {
        this.logger.log(`🔍 Resolving manager chat ID from: ${managerChatIdConfig}`);
        const resolvedChatId = await this.resolveManagerChatId(managerChatIdConfig);
        if (!resolvedChatId) {
          this.logger.error(`❌ Could not resolve manager chat ID from: ${managerChatIdConfig}`);
          return { success: true }; // Не прерываем процесс, просто не отправляем уведомление
        }
        
        this.logger.log(`📤 Sending order notification to manager chat ID: ${resolvedChatId}`);

        const itemsText = orderDetails.items
          .map((item, index) => {
            const itemTotal = item.price * item.quantity;
            return `${index + 1}. ${item.name} (${item.type === 'package' ? 'Пакет' : 'Услуга'})\n   Количество: ${item.quantity}\n   Цена: ${item.price.toFixed(2)} ${orderDetails.currency}\n   Итого: ${itemTotal.toFixed(2)} ${orderDetails.currency}`;
          })
          .join('\n\n');

        const message = `🛒 *Новый заказ*\n\n` +
          `👤 Клиент: ${orderDetails.userName || 'Не указан'}\n` +
          `📱 Телефон: ${normalizedPhone}\n\n` +
          `📦 *Состав заказа:*\n${itemsText}\n\n` +
          `💰 *Общая сумма: ${orderDetails.total.toFixed(2)} ${orderDetails.currency}*\n\n` +
          `⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

        await this.bot.sendMessage(resolvedChatId, message, { parse_mode: 'Markdown' });
        this.logger.log(`✅ Order notification sent to manager chat ${resolvedChatId}`);
      } catch (error) {
        this.logger.error(`❌ Failed to send order notification to manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: true };
  }

  syncUserCart(phone: string, cartData: CartData): void {
    const normalizedPhone = this.normalizePhone(phone);
    this.userCarts.set(normalizedPhone, cartData);
    this.logger.log(`Cart synced for phone: ${normalizedPhone}, items: ${cartData.items.length}`);
  }

  getUserCart(phone: string): CartData | null {
    const normalizedPhone = this.normalizePhone(phone);
    return this.userCarts.get(normalizedPhone) || null;
  }

  private normalizePhone(phone: string): string {
    // Удаляем все пробелы и нецифровые символы, кроме +
    let normalized = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    // Если номер начинается с 7 или 8 без +, добавляем +
    if (normalized.match(/^[78]\d{10}$/)) {
      normalized = '+' + normalized;
    }
    // Если номер начинается с 7, заменяем на +7
    if (normalized.startsWith('7') && !normalized.startsWith('+7')) {
      normalized = '+7' + normalized.substring(1);
    }
    return normalized;
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{10,14}$/;
    return phoneRegex.test(phone);
  }

  private isManagerPhone(phone: string): boolean {
    const normalizedManagerPhone = this.normalizePhone(this.MANAGER_PHONE);
    const normalizedPhone = this.normalizePhone(phone);
    return normalizedPhone === normalizedManagerPhone;
  }

  private async forwardReceiptToClient(managerChatId: number, managerPhone: string, clientPhone: string): Promise<void> {
    try {
      // Проверяем, что это действительно менеджер
      if (!this.isManagerPhone(managerPhone)) {
        await this.bot!.sendMessage(
          managerChatId,
          '❌ У вас нет прав для выполнения этого действия.',
          {
            reply_markup: {
              inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
            }
          }
        );
        return;
      }

      // Находим чек для этого клиента (используем нормализованный номер)
      const normalizedClientPhone = this.normalizePhone(clientPhone);
      let receiptData: { pdfBuffer: Buffer; cart: CartData; clientPhone: string; timestamp: Date } | null = null;
      for (const [receiptId, data] of this.receiptStorage.entries()) {
        const normalizedDataPhone = this.normalizePhone(data.clientPhone);
        if (normalizedDataPhone === normalizedClientPhone) {
          receiptData = data;
          break;
        }
      }

      if (!receiptData) {
        await this.bot!.sendMessage(
          managerChatId,
          `❌ Чек для клиента ${clientPhone} не найден.`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
            }
          }
        );
        return;
      }

      // Находим chatId клиента по номеру телефона
      const clientChatId = this.phoneToChatId.get(this.normalizePhone(clientPhone));
      
      if (!clientChatId) {
        await this.bot!.sendMessage(
          managerChatId,
          `❌ Клиент ${clientPhone} не найден в системе или не начинал диалог с ботом.`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
            }
          }
        );
        return;
      }

      // Отправляем чек клиенту
      await this.bot!.sendDocument(
        clientChatId,
        receiptData.pdfBuffer,
        {
          caption: `💳 *Ваш чек об оплате*\n\n` +
            `✅ Оплата подтверждена\n` +
            `💰 Общая сумма: ${receiptData.cart.total.toFixed(2)} ${receiptData.cart.currency}\n` +
            `⏰ Время: ${receiptData.timestamp.toLocaleString('ru-RU')}`,
          parse_mode: 'Markdown',
          filename: `receipt_${clientPhone}_${Date.now()}.pdf`
        } as any
      );

      // Подтверждаем менеджеру
      await this.bot!.sendMessage(
        managerChatId,
        `✅ Чек успешно отправлен клиенту ${clientPhone}!`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
          }
        }
      );

      this.logger.log(`✅ Receipt forwarded from manager ${managerPhone} to client ${clientPhone}`);
    } catch (error) {
      this.logger.error(`❌ Error forwarding receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.bot!.sendMessage(
        managerChatId,
        `❌ Ошибка при отправке чека клиенту: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '◀️ Назад в меню', callback_data: 'menu' }]]
          }
        }
      );
    }
  }

  private async resolveManagerChatId(chatIdOrUsername: string): Promise<number | null> {
    if (!chatIdOrUsername || chatIdOrUsername.trim() === '') {
      this.logger.warn('⚠️ Empty chat ID or username provided');
      return null;
    }
    
    // Если это уже числовой ID, возвращаем его
    const numericId = parseInt(chatIdOrUsername.trim(), 10);
    if (!isNaN(numericId) && numericId.toString() === chatIdOrUsername.trim()) {
      this.logger.log(`✅ Using numeric chat ID: ${numericId}`);
      return numericId;
    }

    // Если это username (начинается с @ или без), пытаемся найти через бота
    try {
      const username = chatIdOrUsername.startsWith('@') ? chatIdOrUsername.substring(1) : chatIdOrUsername;
      this.logger.log(`🔍 Trying to resolve username to chat ID: ${username}`);
      
      // Пробуем отправить сообщение по username (работает только если пользователь уже писал боту)
      // Но сначала проверим getUpdates для поиска последних чатов
      const updates = await this.bot!.getUpdates({ limit: 100 });
      
      for (const update of updates) {
        if (update.message?.from?.username === username) {
          const chatId = update.message.chat.id;
          this.logger.log(`✅ Found chat ID for username ${username}: ${chatId}`);
          return chatId;
        }
      }
      
      this.logger.warn(`⚠️ Could not find chat ID for username: ${username}. User must start a conversation with the bot first.`);
      return null;
    } catch (error) {
      this.logger.error(`❌ Error resolving chat ID for ${chatIdOrUsername}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private async notifyAdminsAndManagersAboutPayment(cart: CartData, phone: string): Promise<void> {
    try {
      const adminsAndManagers = await this.usersService.findAdminsAndManagers();
      this.logger.log(`📢 Notifying ${adminsAndManagers.length} admin(s) and manager(s) about payment from: ${phone}`);
      
      const itemsText = cart.items
        .map((item, index) => {
          const itemTotal = item.price * item.quantity;
          return `${index + 1}. ${item.name} (${item.type === 'package' ? 'Пакет' : 'Услуга'}) - ${item.quantity} шт. × ${item.price.toFixed(2)} ${cart.currency} = ${itemTotal.toFixed(2)} ${cart.currency}`;
        })
        .join('\n');
      
      const paymentInfo = `💳 Новый платеж\n\n` +
        `📱 Телефон клиента: ${phone}\n` +
        `📦 Товары:\n${itemsText}\n` +
        `💰 Общая сумма: ${cart.total.toFixed(2)} ${cart.currency}\n` +
        `⏰ Время: ${new Date().toLocaleString('ru-RU')}`;
      
      // Логируем для каждого админа и менеджера
      for (const adminOrManager of adminsAndManagers) {
        this.logger.log(`  → ${adminOrManager.email} (${adminOrManager.roles.map(r => r.code).join(', ')}): ${paymentInfo}`);
      }
      
      // Здесь можно добавить отправку уведомлений через WebSocket, email, или другой механизм
      // Пока просто логируем - админ и менеджер могут видеть это в логах и на дашборде
    } catch (error) {
      this.logger.error('Failed to notify admins and managers about payment:', error);
    }
  }
}
