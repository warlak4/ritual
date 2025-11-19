/**
 * Простой скрипт для загрузки шрифтов DejaVu Sans
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '../src/assets/fonts');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Используем прямые ссылки на raw файлы GitHub
const fonts = [
  {
    name: 'DejaVuSans.ttf',
    url: 'https://raw.githubusercontent.com/dejavu-fonts/dejavu-fonts/master/ttf/DejaVuSans.ttf'
  },
  {
    name: 'DejaVuSans-Bold.ttf',
    url: 'https://raw.githubusercontent.com/dejavu-fonts/dejavu-fonts/master/ttf/DejaVuSans-Bold.ttf'
  }
];

function downloadFont(fontName, url) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, fontName);
    
    console.log(`📥 Загрузка ${fontName}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Редирект
        https.get(response.headers.location, (redirectResponse) => {
          if (redirectResponse.statusCode !== 200) {
            reject(new Error(`Ошибка загрузки после редиректа: ${redirectResponse.statusCode}`));
            return;
          }
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            const stats = fs.statSync(filePath);
            console.log(`✅ ${fontName} загружен (${(stats.size / 1024).toFixed(2)} KB)`);
            resolve();
          });
        }).on('error', reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Ошибка загрузки: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filePath);
        if (stats.size < 1000) {
          fs.unlinkSync(filePath);
          reject(new Error(`Файл слишком маленький (${stats.size} байт), возможно поврежден`));
          return;
        }
        console.log(`✅ ${fontName} загружен (${(stats.size / 1024).toFixed(2)} KB)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function downloadAllFonts() {
  console.log('🚀 Загрузка шрифтов DejaVu Sans для поддержки кириллицы...\n');
  
  try {
    for (const font of fonts) {
      await downloadFont(font.name, font.url);
    }
    
    console.log('\n✅ Все шрифты загружены успешно!');
    console.log('\nТеперь пересоберите Docker образ:');
    console.log('  cd ops');
    console.log('  docker-compose build --no-cache backend');
    console.log('  docker-compose up -d backend');
  } catch (error) {
    console.error('\n❌ Ошибка при загрузке шрифтов:', error.message);
    console.error('\nАльтернативный способ:');
    console.error('1. Перейдите на https://github.com/dejavu-fonts/dejavu-fonts/releases');
    console.error('2. Скачайте архив dejavu-fonts-ttf-2.37.zip');
    console.error('3. Извлеките DejaVuSans.ttf и DejaVuSans-Bold.ttf');
    console.error(`4. Поместите их в ${fontsDir}`);
    process.exit(1);
  }
}

downloadAllFonts();

