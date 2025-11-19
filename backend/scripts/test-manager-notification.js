/**
 * Скрипт для тестирования отправки уведомления менеджеру
 * Использование: node scripts/test-manager-notification.js [CHAT_ID]
 */

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '8558062986:AAHAX6CTkUl2OIQmwAHqWC3QE25LKE2yieY';
const CHAT_ID = process.argv[2] || '7222886369'; // Chat ID менеджера Tomat3r

if (!CHAT_ID) {
  console.error('❌ Ошибка: Укажите Chat ID');
  console.log('Использование: node scripts/test-manager-notification.js <CHAT_ID>');
  console.log('\nChat ID менеджера Tomat3r: 7222886369');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function testManagerNotification() {
  try {
    console.log('🤖 Тестирование отправки уведомления менеджеру...\n');
    
    // Проверка информации о боте
    const me = await bot.getMe();
    console.log(`✅ Бот подключен: @${me.username}\n`);
    
    const chatId = parseInt(CHAT_ID, 10);
    if (isNaN(chatId)) {
      console.error(`❌ Ошибка: "${CHAT_ID}" не является валидным числовым Chat ID`);
      process.exit(1);
    }
    
    console.log(`📤 Отправка тестового сообщения на Chat ID: ${chatId}`);
    
    // Отправляем тестовое сообщение
    const message = await bot.sendMessage(
      chatId,
      `🧪 *Тестовое уведомление*\n\n` +
        `Это тестовое сообщение для проверки настройки уведомлений менеджеру.\n\n` +
        `Если вы получили это сообщение, значит Chat ID настроен правильно! ✅`,
      { parse_mode: 'Markdown' }
    );
    
    console.log('✅ Сообщение успешно отправлено!');
    console.log(`   Message ID: ${message.message_id}`);
    console.log(`   Chat ID: ${message.chat.id}`);
    console.log(`   Chat type: ${message.chat.type}`);
    
    // Пробуем отправить тестовый PDF
    console.log('\n📄 Тестирование отправки PDF...');
    
    const PDFDocument = require('pdfkit');
    const buffers = [];
    
    const doc = new PDFDocument({ margin: 50 });
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        console.log(`✅ PDF создан, размер: ${pdfBuffer.length} байт`);
        
        const docMessage = await bot.sendDocument(
          chatId,
          pdfBuffer,
          {
            filename: `test_receipt_${Date.now()}.pdf`,
            caption: `🧪 *Тестовый PDF чек*\n\nЭто тестовый PDF для проверки отправки чеков.`,
            parse_mode: 'Markdown'
          }
        );
        
        console.log('✅ PDF успешно отправлен!');
        console.log(`   Message ID: ${docMessage.message_id}`);
        console.log('\n🎉 Все тесты пройдены успешно!');
        console.log('   Менеджер должен получать уведомления и чеки.');
        
      } catch (error) {
        console.error('❌ Ошибка при отправке PDF:', error.message);
        if (error.response) {
          console.error('Детали:', JSON.stringify(error.response.body, null, 2));
        }
        process.exit(1);
      }
    });
    
    doc.fontSize(24)
      .text('ТЕСТОВЫЙ ЧЕК', { align: 'center' })
      .moveDown()
      .fontSize(18)
      .fillColor('green')
      .text('ОПЛАЧЕНО', { align: 'center' })
      .fillColor('black')
      .moveDown(2)
      .fontSize(12)
      .text('Это тестовый чек для проверки отправки PDF менеджеру.', { align: 'center' })
      .moveDown()
      .text(`Время: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });
    
    doc.end();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Детали ответа Telegram API:');
      console.error(JSON.stringify(error.response.body, null, 2));
      
      if (error.response.body.error_code === 403) {
        console.error('\n💡 Возможные причины:');
        console.error('   1. Пользователь заблокировал бота');
        console.error('   2. Chat ID указан неверно');
      } else if (error.response.body.error_code === 400) {
        console.error('\n💡 Возможные причины:');
        console.error('   1. Chat ID указан неверно');
        console.error('   2. Пользователь не начинал диалог с ботом');
      }
    }
    process.exit(1);
  }
}

testManagerNotification();

