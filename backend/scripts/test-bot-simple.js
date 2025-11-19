/**
 * Простой тест Telegram бота
 * Проверяет подключение и отправляет тестовое сообщение
 */

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '8558062986:AAHAX6CTkUl2OIQmwAHqWC3QE25LKE2yieY';

async function testBot() {
  try {
    console.log('🤖 Тестирование подключения к Telegram боту...\n');
    
    const bot = new TelegramBot(BOT_TOKEN, { polling: false });
    
    // Проверка информации о боте
    const me = await bot.getMe();
    console.log('✅ Бот подключен к Telegram:');
    console.log(`   Имя: ${me.first_name}`);
    console.log(`   Username: @${me.username}`);
    console.log(`   ID: ${me.id}\n`);
    
    console.log('📝 Для тестирования работы бота:');
    console.log('1. Убедитесь, что backend запущен (npm run start:dev)');
    console.log('2. Откройте @RitualCode_bot в Telegram');
    console.log('3. Отправьте команду /start');
    console.log('4. Или отправьте номер телефона, например: +79991234567\n');
    
    console.log('💡 Бот работает в режиме polling и автоматически обрабатывает сообщения');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Детали:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

testBot();

