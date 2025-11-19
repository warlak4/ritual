/**
 * Скрипт для проверки конфигурации Telegram бота
 */

const fs = require('fs');
const path = require('path');

// Читаем .env файл напрямую
const envPath = path.join(__dirname, '..', '.env');
let TELEGRAM_BOT_TOKEN = '';
let TELEGRAM_CHAT_ID = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('TELEGRAM_BOT_TOKEN=')) {
      TELEGRAM_BOT_TOKEN = trimmed.split('=')[1]?.trim() || '';
    }
    if (trimmed.startsWith('TELEGRAM_CHAT_ID=')) {
      TELEGRAM_CHAT_ID = trimmed.split('=')[1]?.trim() || '';
    }
  }
} else {
  console.log('⚠️  Файл .env не найден!');
}

console.log('🔍 Проверка конфигурации Telegram бота\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (!TELEGRAM_BOT_TOKEN) {
  console.log('❌ TELEGRAM_BOT_TOKEN: НЕ НАСТРОЕН');
} else {
  console.log(`✅ TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
}

if (!TELEGRAM_CHAT_ID) {
  console.log('❌ TELEGRAM_CHAT_ID: НЕ НАСТРОЕН');
  console.log('\n💡 Добавьте в backend/.env:');
  console.log('   TELEGRAM_CHAT_ID=7222886369');
} else {
  console.log(`✅ TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID}`);
  
  // Проверяем, является ли это числом
  const numericId = parseInt(TELEGRAM_CHAT_ID, 10);
  if (isNaN(numericId)) {
    console.log('⚠️  ВНИМАНИЕ: TELEGRAM_CHAT_ID не является числом');
    console.log('   Это может быть username. Убедитесь, что менеджер написал боту /start');
  } else {
    console.log(`✅ Chat ID валиден (числовой): ${numericId}`);
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.log('❌ Конфигурация неполная. Исправьте ошибки выше.');
  process.exit(1);
} else {
  console.log('✅ Конфигурация выглядит правильно!');
  console.log('\n💡 Если бот не работает:');
  console.log('   1. Убедитесь, что backend перезапущен после изменения .env');
  console.log('   2. Проверьте логи backend на наличие ошибок');
  console.log('   3. Убедитесь, что менеджер написал боту /start');
  console.log('\n📝 Для перезапуска бота:');
  console.log('   - Остановите backend (Ctrl+C)');
  console.log('   - Запустите снова: npm run start:dev');
}
