/**
 * Тестовый скрипт для проверки кириллицы в PDF
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '../test-receipt-cyrillic.pdf');

console.log('📄 Генерация тестового PDF с кириллицей...\n');

const doc = new PDFDocument({ margin: 50 });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Пытаемся загрузить кастомный шрифт с поддержкой кириллицы
const fontsDir = path.join(__dirname, '../src/assets/fonts');
const fontPath = path.join(fontsDir, 'DejaVuSans.ttf');
const fontBoldPath = path.join(fontsDir, 'DejaVuSans-Bold.ttf');

let font = 'Courier';
let fontBold = 'Courier-Bold';
let fontLoaded = false;

if (fs.existsSync(fontPath)) {
  try {
    const stats = fs.statSync(fontPath);
    if (stats.size < 1000) {
      console.warn('⚠️ Файл DejaVuSans.ttf слишком маленький, возможно поврежден');
    } else {
      doc.registerFont('DejaVuSans', fontPath);
      font = 'DejaVuSans';
      fontLoaded = true;
      console.log(`✅ Шрифт DejaVuSans загружен (${(stats.size / 1024).toFixed(2)} KB)`);
    }
  } catch (error) {
    console.warn('⚠️ Не удалось загрузить DejaVuSans:', error.message);
    console.warn('   Используется стандартный шрифт Courier');
  }
} else {
  console.warn('⚠️ Файл DejaVuSans.ttf не найден в:', fontPath);
  console.warn('   Используется стандартный шрифт Courier (кириллица может отображаться некорректно)');
}

if (fs.existsSync(fontBoldPath)) {
  try {
    // Проверяем размер файла - если слишком маленький, возможно файл поврежден
    const stats = fs.statSync(fontBoldPath);
    if (stats.size < 1000) {
      console.warn('⚠️ Файл DejaVuSans-Bold.ttf слишком маленький, возможно поврежден');
      console.warn('   Используется обычный шрифт для жирного текста');
      fontBold = font; // Используем обычный шрифт
    } else {
      doc.registerFont('DejaVuSans-Bold', fontBoldPath);
      fontBold = 'DejaVuSans-Bold';
      console.log('✅ Шрифт DejaVuSans-Bold загружен');
    }
  } catch (error) {
    console.warn('⚠️ Не удалось загрузить DejaVuSans-Bold:', error.message);
    console.warn('   Используется обычный шрифт для жирного текста');
    fontBold = font; // Используем обычный шрифт
  }
} else {
  console.warn('⚠️ Файл DejaVuSans-Bold.ttf не найден, используем обычный шрифт');
  fontBold = font; // Используем обычный шрифт
}

console.log(`\n📝 Используемые шрифты: ${font} / ${fontBold}\n`);

// Заголовок - используем правильное имя зарегистрированного шрифта
doc.font(font) // Используем зарегистрированный DejaVuSans
  .fontSize(24)
  .text('ЧЕК ОБ ОПЛАТЕ', { align: 'center' })
  .moveDown();

// Статус оплаты
doc.fontSize(18)
  .fillColor('green')
  .text('ОПЛАЧЕНО', { align: 'center' })
  .fillColor('black')
  .moveDown(2);

// Информация о клиенте
doc.font(font)
  .fontSize(12)
  .text('Телефон клиента: +79991234567', { align: 'left' })
  .text(`Дата и время: ${new Date().toLocaleString('ru-RU')}`, { align: 'left' })
  .moveDown();

// Разделитель
doc.moveTo(50, doc.y)
  .lineTo(550, doc.y)
  .stroke()
  .moveDown();

// Товары
doc.fontSize(14)
  .text('Состав заказа:', { align: 'left' })
  .moveDown(0.5);

const testItems = [
  { name: 'Премиум похороны', type: 'package', quantity: 1, price: 180000 },
  { name: 'Ритуальная церемония', type: 'service', quantity: 2, price: 5000 },
  { name: 'Транспортные услуги', type: 'service', quantity: 1, price: 10000 }
];

testItems.forEach((item, index) => {
  const itemTotal = item.price * item.quantity;
  
  doc.fontSize(12)
    .text(`${index + 1}. ${item.name}`, { align: 'left' })
    .fontSize(10)
    .text(`   Тип: ${item.type === 'package' ? 'Пакет' : 'Услуга'}`, { align: 'left' })
    .text(`   Количество: ${item.quantity}`, { align: 'left' })
    .text(`   Цена за единицу: ${item.price.toFixed(2)} RUB`, { align: 'left' })
    .text(`   Итого: ${itemTotal.toFixed(2)} RUB`, { align: 'left' })
    .moveDown();
});

// Разделитель
doc.moveTo(50, doc.y)
  .lineTo(550, doc.y)
  .stroke()
  .moveDown();

// Итоговая сумма
const total = testItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
doc.fontSize(16)
  .font(font) // Используем зарегистрированный DejaVuSans
  .text(`Общая сумма: ${total.toFixed(2)} RUB`, { align: 'right' })
  .moveDown(2);

// Подпись
doc.fontSize(10)
  .font(font)
  .fillColor('gray')
  .text('Спасибо за ваш заказ!', { align: 'center' })
  .moveDown()
  .text(`Чек сгенерирован: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' })
  .moveDown()
  .text('Тестовый чек для проверки кириллицы', { align: 'center' });

doc.end();

stream.on('finish', () => {
  console.log(`\n✅ PDF создан: ${outputPath}`);
  console.log(`\n📊 Статус:`);
  console.log(`   - Шрифт с кириллицей: ${fontLoaded ? '✅ Загружен' : '❌ Не загружен (используется Courier)'}`);
  console.log(`   - Размер файла: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
  console.log(`\n💡 Откройте файл и проверьте, что кириллица отображается корректно.`);
  console.log(`   Если кириллица отображается некорректно, убедитесь, что шрифты загружены:`);
  console.log(`   - backend/src/assets/fonts/DejaVuSans.ttf`);
  console.log(`   - backend/src/assets/fonts/DejaVuSans-Bold.ttf`);
});
