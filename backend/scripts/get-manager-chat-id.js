/**
 * Скрипт для получения Chat ID менеджера по username
 * Использование: node scripts/get-manager-chat-id.js [username]
 */

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '8558062986:AAHAX6CTkUl2OIQmwAHqWC3QE25LKE2yieY';
const USERNAME = process.argv[2] || 'Tomat3r';

async function getManagerChatId() {
  try {
    console.log(`🔍 Поиск Chat ID для пользователя: @${USERNAME}\n`);
    
    const bot = new TelegramBot(BOT_TOKEN, { polling: false });
    
    // Проверяем информацию о боте
    const me = await bot.getMe();
    console.log(`✅ Бот подключен: @${me.username}\n`);
    
    // Получаем последние обновления
    console.log('📥 Получаем последние сообщения...');
    const updates = await bot.getUpdates({ limit: 100, offset: 0 });
    
    if (updates.length === 0) {
      console.log('❌ Не найдено сообщений от пользователей.');
      console.log('\n💡 Решение:');
      console.log(`   1. Попросите менеджера @${USERNAME} написать боту @${me.username}`);
      console.log('   2. Менеджер должен отправить команду /start');
      console.log('   3. Затем запустите этот скрипт снова\n');
      return;
    }
    
    console.log(`📊 Найдено ${updates.length} обновлений\n`);
    
    // Ищем пользователя по username
    let found = false;
    for (const update of updates) {
      const message = update.message;
      if (message && message.from) {
        const username = message.from.username;
        const chatId = message.chat.id;
        const firstName = message.from.first_name || '';
        const lastName = message.from.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        if (username && username.toLowerCase() === USERNAME.toLowerCase()) {
          console.log('✅ НАЙДЕН!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`   Username: @${username}`);
          console.log(`   Имя: ${fullName || 'Не указано'}`);
          console.log(`   Chat ID: ${chatId}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('📝 Добавьте в файл backend/.env:');
          console.log(`   TELEGRAM_CHAT_ID=${chatId}\n`);
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      console.log(`❌ Пользователь @${USERNAME} не найден в последних сообщениях.\n`);
      console.log('💡 Возможные причины:');
      console.log(`   1. Менеджер @${USERNAME} еще не писал боту`);
      console.log('   2. Username указан неверно');
      console.log('   3. Сообщение было отправлено слишком давно\n');
      console.log('📋 Найденные пользователи:');
      const uniqueUsers = new Map();
      for (const update of updates) {
        const message = update.message;
        if (message && message.from && message.from.username) {
          const username = message.from.username;
          if (!uniqueUsers.has(username)) {
            uniqueUsers.set(username, {
              chatId: message.chat.id,
              name: `${message.from.first_name || ''} ${message.from.last_name || ''}`.trim()
            });
          }
        }
      }
      
      if (uniqueUsers.size > 0) {
        console.log('');
        for (const [username, info] of uniqueUsers.entries()) {
          console.log(`   @${username} (${info.name || 'Без имени'}) - Chat ID: ${info.chatId}`);
        }
        console.log('');
      }
      
      console.log('\n💡 Решение:');
      console.log(`   1. Попросите менеджера @${USERNAME} написать боту @${me.username}`);
      console.log('   2. Менеджер должен отправить команду /start');
      console.log('   3. Затем запустите этот скрипт снова\n');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Детали:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

getManagerChatId();

