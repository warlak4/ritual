/**
 * Скрипт для изменения роли пользователя
 * Использование: node scripts/change-user-role.js <firstName> <lastName> <roleCode>
 * Пример: node scripts/change-user-role.js Ксения Тишкина client
 */

const { createConnection } = require('typeorm');
const path = require('path');

async function changeUserRole(firstName, lastName, roleCode) {
  let connection;
  
  try {
    // Подключение к базе данных
    connection = await createConnection({
      type: 'mssql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433'),
      username: process.env.DB_USERNAME || 'sa',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'ritual',
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
      },
      entities: [path.join(__dirname, '../dist/src/database/entities/*.js')],
    });

    console.log('✅ Подключение к базе данных установлено');

    // Найти пользователя
    const userRepo = connection.getRepository('UserEntity');
    const roleRepo = connection.getRepository('RoleEntity');
    
    const user = await userRepo.findOne({
      where: { firstName, lastName },
      relations: ['roles'],
    });

    if (!user) {
      console.error(`❌ Пользователь "${firstName} ${lastName}" не найден`);
      process.exit(1);
    }

    console.log(`✅ Найден пользователь: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   Текущие роли: ${user.roles.map(r => r.code).join(', ')}`);

    // Найти роль
    const role = await roleRepo.findOne({ where: { code: roleCode } });
    if (!role) {
      console.error(`❌ Роль "${roleCode}" не найдена`);
      process.exit(1);
    }

    // Обновить роли пользователя
    user.roles = [role];
    await userRepo.save(user);

    // Перезагрузить пользователя с обновленными ролями
    const updatedUser = await userRepo.findOne({
      where: { id: user.id },
      relations: ['roles'],
    });

    console.log(`✅ Роль пользователя изменена`);
    console.log(`   Новые роли: ${updatedUser.roles.map(r => r.code).join(', ')}`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('✅ Соединение закрыто');
    }
  }
}

// Получить аргументы командной строки
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Использование: node scripts/change-user-role.js <firstName> <lastName> <roleCode>');
  console.error('Пример: node scripts/change-user-role.js Ксения Тишкина client');
  process.exit(1);
}

const [firstName, lastName, roleCode] = args;
changeUserRole(firstName, lastName, roleCode);

