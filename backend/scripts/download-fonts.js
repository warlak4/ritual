/**
 * Скрипт для загрузки шрифтов DejaVu Sans с поддержкой кириллицы
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '../src/assets/fonts');

// Создаем директорию если её нет
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

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
    
    // Проверяем, существует ли уже файл
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${fontName} уже существует, пропускаем`);
      resolve();
      return;
    }
    
    console.log(`📥 Загрузка ${fontName}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Ошибка загрузки: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ ${fontName} загружен успешно`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Удаляем частично загруженный файл
      reject(err);
    });
  });
}

async function downloadAllFonts() {
  console.log('🚀 Начинаем загрузку шрифтов для поддержки кириллицы...\n');
  
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
    console.error('\nВы можете скачать шрифты вручную:');
    console.error('  1. Перейдите на https://github.com/dejavu-fonts/dejavu-fonts');
    console.error('  2. Скачайте DejaVuSans.ttf и DejaVuSans-Bold.ttf');
    console.error(`  3. Поместите их в ${fontsDir}`);
    process.exit(1);
  }
}

downloadAllFonts();

