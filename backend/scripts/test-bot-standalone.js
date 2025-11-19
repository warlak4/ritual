/**
 * Standalone тест Telegram бота (без NestJS)
 * Проверяет, что бот может получать и отправлять сообщения
 */

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '8558062986:AAHAX6CTkUl2OIQmwAHqWC3QE25LKE2yieY';

console.log('🤖 Запуск standalone теста Telegram бота...\n');

const bot = new TelegramBot(BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`✅ Получена команда /start от chat ${chatId}`);
  
  bot.sendMessage(chatId, 
    '👋 Добро пожаловать!\n\n' +
    'Для получения кода регистрации отправьте ваш номер телефона в формате:\n' +
    '+79991234567\n\n' +
    'Или просто отправьте номер телефона.'
  ).then(() => {
    console.log(`✅ Ответ отправлен в chat ${chatId}`);
  }).catch((error) => {
    console.error(`❌ Ошибка отправки: ${error.message}`);
  });
});

// Обработчик всех сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (text && !text.startsWith('/')) {
    console.log(`📨 Получено сообщение от chat ${chatId}: ${text}`);
    
    // Простая проверка формата телефона
    const phoneRegex = /^\+?[1-9]\d{10,14}$/;
    const normalizedPhone = text.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    if (phoneRegex.test(normalizedPhone)) {
      bot.sendMessage(chatId, 
        `✅ Номер телефона принят: ${normalizedPhone}\n\n` +
        `Для получения кода сначала запросите его на сайте, затем отправьте номер телефона боту.`
      ).then(() => {
        console.log(`✅ Ответ отправлен для телефона ${normalizedPhone}`);
      });
    } else {
      bot.sendMessage(chatId,
        '❌ Неверный формат номера телефона.\n\n' +
        'Пожалуйста, отправьте номер в формате:\n' +
        '+79991234567'
      );
    }
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error(`❌ Polling error: ${error.message}`);
});

bot.on('error', (error) => {
  console.error(`❌ Bot error: ${error.message}`);
});

// Проверка подключения
bot.getMe().then((me) => {
  console.log(`✅ Бот подключен: @${me.username} (${me.first_name})`);
  console.log(`✅ Бот готов к работе!`);
  console.log(`\n📱 Откройте @RitualCode_bot в Telegram и отправьте /start`);
  console.log(`\n⚠️  Для остановки нажмите Ctrl+C\n`);
}).catch((error) => {
  console.error(`❌ Ошибка подключения: ${error.message}`);
  process.exit(1);
});

// Обработка завершения
process.on('SIGINT', async () => {
  console.log('\n⏹️  Остановка бота...');
  await bot.stopPolling();
  console.log('✅ Бот остановлен');
  process.exit(0);
});

