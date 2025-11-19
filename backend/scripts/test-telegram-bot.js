/**
 * Скрипт для тестирования Telegram бота
 * Использование: node scripts/test-telegram-bot.js <CHAT_ID>
 */

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '8558062986:AAHAX6CTkUl2OIQmwAHqWC3QE25LKE2yieY';
const CHAT_ID = process.argv[2];

if (!CHAT_ID) {
  console.error('❌ Ошибка: Укажите Chat ID');
  console.log('Использование: node scripts/test-telegram-bot.js <CHAT_ID>');
  console.log('\nЧтобы получить Chat ID:');
  console.log('1. Начните диалог с ботом @RitualCode_bot');
  console.log('2. Откройте: https://api.telegram.org/bot8558062986:AAHAX6CTkUl2OIQmwAHqWC3QE25LKE2yieY/getUpdates');
  console.log('3. Найдите "chat":{"id":123456789}');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function testBot() {
  try {
    console.log('🤖 Тестирование Telegram бота...');
    console.log(`📱 Chat ID: ${CHAT_ID}`);
    
    // Тест 1: Отправка кода регистрации
    const registrationMessage = `🔐 Код подтверждения\n\n` +
      `Email: test@example.com\n` +
      `Код: 123456\n\n` +
      `Используйте этот код для завершения регистрации.`;
    
    await bot.sendMessage(CHAT_ID, registrationMessage);
    console.log('✅ Тест 1: Код регистрации отправлен');
    
    // Небольшая задержка
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Тест 2: Отправка кода входа
    const loginMessage = `🔑 Код для входа\n\n` +
      `Email: test@example.com\n` +
      `Код: 789012\n\n` +
      `Используйте этот код для входа в систему.`;
    
    await bot.sendMessage(CHAT_ID, loginMessage);
    console.log('✅ Тест 2: Код входа отправлен');
    
    console.log('\n🎉 Все тесты пройдены! Проверьте Telegram чат.');
    console.log('\nТеперь добавьте в .env файл:');
    console.log(`TELEGRAM_BOT_TOKEN=${BOT_TOKEN}`);
    console.log(`TELEGRAM_CHAT_ID=${CHAT_ID}`);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании бота:', error.message);
    if (error.response) {
      console.error('Детали:', error.response.body);
    }
    process.exit(1);
  }
}

testBot();

