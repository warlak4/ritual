/**
 * Скрипт для постоянного запуска бота
 * Автоматически перезапускает бот при падении
 */

const { spawn } = require('child_process');
const path = require('path');

let botProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 100; // Максимум перезапусков за сессию

function startBot() {
  console.log(`🚀 Запуск Telegram бота (попытка ${restartCount + 1})...`);
  
  botProcess = spawn('npm', ['run', 'start:dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  botProcess.on('exit', (code, signal) => {
    console.log(`\n⚠️  Бот завершился с кодом ${code}, сигнал: ${signal}`);
    
    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log(`🔄 Перезапуск через 5 секунд...`);
      setTimeout(() => {
        startBot();
      }, 5000);
    } else {
      console.log(`❌ Достигнут лимит перезапусков (${MAX_RESTARTS}). Остановка.`);
      process.exit(1);
    }
  });

  botProcess.on('error', (error) => {
    console.error(`❌ Ошибка запуска бота: ${error.message}`);
    
    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log(`🔄 Перезапуск через 5 секунд...`);
      setTimeout(() => {
        startBot();
      }, 5000);
    }
  });
}

// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('\n⏹️  Остановка бота...');
  if (botProcess) {
    botProcess.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Остановка бота...');
  if (botProcess) {
    botProcess.kill('SIGTERM');
  }
  process.exit(0);
});

// Запуск
console.log('🤖 Запуск Telegram бота в режиме постоянной работы...');
console.log('💡 Бот будет автоматически перезапускаться при падении\n');
startBot();

