/**
 * Скрипт для загрузки и установки шрифтов DejaVu Sans
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fontsDir = path.join(__dirname, '../src/assets/fonts');

// Создаем директорию если её нет
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
  console.log('✅ Директория для шрифтов создана');
}

const zipUrl = 'https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.zip';
const zipPath = path.join(__dirname, '../dejavu-fonts.zip');
const extractDir = path.join(__dirname, '../temp-fonts');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Загрузка ${path.basename(dest)}...`);
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Редирект
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Ошибка загрузки: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r   Прогресс: ${percent}%`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ Загрузка завершена');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function extractZip(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    console.log('📦 Извлечение архива...');
    try {
      // Используем библиотеку adm-zip
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(destDir, true);
      console.log('✅ Архив извлечен');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function installFonts() {
  try {
    // Шаг 1: Загрузка архива
    await downloadFile(zipUrl, zipPath);
    
    // Шаг 2: Извлечение
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    await extractZip(zipPath, extractDir);
    
    // Шаг 3: Копирование файлов
    console.log('📋 Копирование шрифтов...');
    const font1Source = path.join(extractDir, 'dejavu-fonts-ttf-2.37', 'ttf', 'DejaVuSans.ttf');
    const font2Source = path.join(extractDir, 'dejavu-fonts-ttf-2.37', 'ttf', 'DejaVuSans-Bold.ttf');
    
    const font1Dest = path.join(fontsDir, 'DejaVuSans.ttf');
    const font2Dest = path.join(fontsDir, 'DejaVuSans-Bold.ttf');
    
    if (fs.existsSync(font1Source)) {
      fs.copyFileSync(font1Source, font1Dest);
      const stats = fs.statSync(font1Dest);
      console.log(`✅ DejaVuSans.ttf скопирован (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      throw new Error(`Файл не найден: ${font1Source}`);
    }
    
    if (fs.existsSync(font2Source)) {
      fs.copyFileSync(font2Source, font2Dest);
      const stats = fs.statSync(font2Dest);
      console.log(`✅ DejaVuSans-Bold.ttf скопирован (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      throw new Error(`Файл не найден: ${font2Source}`);
    }
    
    // Шаг 4: Очистка
    console.log('🧹 Очистка временных файлов...');
    fs.unlinkSync(zipPath);
    fs.rmSync(extractDir, { recursive: true, force: true });
    console.log('✅ Временные файлы удалены');
    
    console.log('\n✅ Шрифты успешно установлены!');
    console.log('\nТеперь можно:');
    console.log('  1. Запустить тест: node scripts/test-pdf-cyrillic.js');
    console.log('  2. Отправить тестовый PDF: node scripts/send-test-pdf.js 7222886369');
    console.log('  3. Пересобрать Docker: cd ops && docker-compose build --no-cache backend');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    console.error('\nПопробуйте загрузить шрифты вручную:');
    console.error('  1. https://github.com/dejavu-fonts/dejavu-fonts/releases');
    console.error('  2. Скачайте dejavu-fonts-ttf-2.37.zip');
    console.error(`  3. Извлеките DejaVuSans.ttf и DejaVuSans-Bold.ttf в ${fontsDir}`);
    process.exit(1);
  }
}

installFonts();

