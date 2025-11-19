/**
 * Скрипт для изменения роли пользователя через SQL
 * Использование: node scripts/change-user-role-sql.js <firstName> <lastName> <roleCode>
 * Пример: node scripts/change-user-role-sql.js Ксения Тишкина client
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function changeUserRoleSQL(firstName, lastName, roleCode) {
  try {
    console.log(`🔍 Ищу пользователя "${firstName} ${lastName}"...`);

    // SQL запрос для поиска пользователя и изменения роли
    const sql = `
      -- Найти ID пользователя и роли
      DECLARE @userId UNIQUEIDENTIFIER;
      DECLARE @roleId INT;
      
      -- Найти пользователя
      SELECT @userId = id 
      FROM domain.users 
      WHERE first_name = '${firstName}' AND last_name = '${lastName}';
      
      IF @userId IS NULL
      BEGIN
        PRINT 'Пользователь не найден';
        RETURN;
      END
      
      -- Найти роль
      SELECT @roleId = id 
      FROM ref.roles 
      WHERE code = '${roleCode}';
      
      IF @roleId IS NULL
      BEGIN
        PRINT 'Роль не найдена';
        RETURN;
      END
      
      -- Удалить все текущие роли пользователя
      DELETE FROM domain.user_roles WHERE user_id = @userId;
      
      -- Добавить новую роль
      INSERT INTO domain.user_roles (user_id, role_id, assigned_at)
      VALUES (@userId, @roleId, GETDATE());
      
      -- Показать результат
      SELECT 
        u.first_name,
        u.last_name,
        u.email,
        r.code as role_code,
        r.name_ru as role_name
      FROM domain.users u
      INNER JOIN domain.user_roles ur ON u.id = ur.user_id
      INNER JOIN ref.roles r ON ur.role_id = r.id
      WHERE u.id = @userId;
    `;

    // Выполнить SQL через docker exec
    const dockerCmd = `docker exec -i ritual_sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "${sql.replace(/\n/g, ' ').replace(/\s+/g, ' ')}"`;

    console.log('🔄 Выполняю SQL запрос...');
    const { stdout, stderr } = await execPromise(dockerCmd);

    if (stderr && !stderr.includes('rows affected')) {
      console.error('❌ Ошибка:', stderr);
      return;
    }

    if (stdout.includes('Пользователь не найден')) {
      console.error(`❌ Пользователь "${firstName} ${lastName}" не найден`);
      return;
    }

    if (stdout.includes('Роль не найдена')) {
      console.error(`❌ Роль "${roleCode}" не найдена`);
      return;
    }

    console.log('✅ Роль пользователя успешно изменена!');
    console.log(stdout);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.stderr) {
      console.error('Stderr:', error.stderr);
    }
  }
}

// Получить аргументы командной строки
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Использование: node scripts/change-user-role-sql.js <firstName> <lastName> <roleCode>');
  console.error('Пример: node scripts/change-user-role-sql.js Ксения Тишкина client');
  process.exit(1);
}

const [firstName, lastName, roleCode] = args;
changeUserRoleSQL(firstName, lastName, roleCode);

