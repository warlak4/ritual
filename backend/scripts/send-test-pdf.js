/**
 * Скрипт для отправки тестового PDF через Telegram бота
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8558062986:AAHAX6CTkUl2OIQmwAHqWC3QE25LKE2yieY';
const TEST_CHAT_ID = process.argv[2]; // Передайте Chat ID как аргумент

if (!TEST_CHAT_ID) {
  console.error('❌ Ошибка: Укажите Chat ID для отправки тестового PDF');
  console.log('Использование: node scripts/send-test-pdf.js <CHAT_ID>');
  console.log('Пример: node scripts/send-test-pdf.js 7222886369');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });
const pdfPath = path.join(__dirname, '..', 'test-receipt-cyrillic.pdf');

async function sendTestPDF() {
  try {
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ Файл test-receipt-cyrillic.pdf не найден!');
      console.log('Сначала запустите: node scripts/test-pdf-cyrillic.js');
      process.exit(1);
    }

    console.log(`📤 Отправка тестового PDF в чат ${TEST_CHAT_ID}...`);

    const pdfBuffer = fs.readFileSync(pdfPath);

    await bot.sendDocument(
      parseInt(TEST_CHAT_ID, 10),
      pdfBuffer,
      {
        caption: `🧪 *Тестовый PDF с кириллицей*\n\n` +
          `Этот PDF создан для проверки отображения кириллицы.\n` +
          `Проверьте, что все русские символы отображаются корректно.`,
        parse_mode: 'Markdown',
        filename: 'test-receipt-cyrillic.pdf'
      }
    );

    console.log('✅ Тестовый PDF отправлен успешно!');
    console.log('\nПроверьте полученный файл - кириллица должна отображаться корректно.');

  } catch (error) {
    console.error('❌ Ошибка при отправке PDF:', error.message);
    if (error.response) {
      console.error('Детали ошибки Telegram API:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

sendTestPDF();

