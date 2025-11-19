/**
 * Скрипт для изменения роли пользователя через API
 * Использование: node scripts/change-user-role-api.js <firstName> <lastName> <roleCode> [adminToken]
 * Пример: node scripts/change-user-role-api.js Ксения Тишкина client
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function changeUserRoleAPI(firstName, lastName, roleCode, adminToken) {
  try {
    console.log(`🔍 Ищу пользователя "${firstName} ${lastName}"...`);

    // Если токен не передан, попробуем найти пользователя и использовать его токен
    // Или можно использовать прямой SQL через другой метод
    
    // Сначала найдем пользователя через API (если есть публичный endpoint)
    // Или используем прямой SQL запрос через файл
    
    console.log('⚠️  Для использования API нужен токен администратора');
    console.log('💡 Используйте альтернативный метод через SQL файл');
    
    // Создадим SQL файл
    const sqlContent = `
-- Изменить роль пользователя "${firstName} ${lastName}" на "${roleCode}"
DECLARE @userId UNIQUEIDENTIFIER;
DECLARE @roleId INT;

-- Найти пользователя
SELECT @userId = id 
FROM domain.users 
WHERE first_name = N'${firstName}' AND last_name = N'${lastName}';

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

    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'change-role-temp.sql');
    
    fs.writeFileSync(sqlFile, sqlContent, 'utf8');
    console.log(`✅ SQL файл создан: ${sqlFile}`);
    console.log('');
    console.log('Выполните команду:');
    console.log(`docker exec -i ritual_sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -i /tmp/change-role-temp.sql`);
    console.log('');
    console.log('Или скопируйте содержимое файла и выполните в SQL Server Management Studio');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Получить аргументы командной строки
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Использование: node scripts/change-user-role-api.js <firstName> <lastName> <roleCode>');
  console.error('Пример: node scripts/change-user-role-api.js Ксения Тишкина client');
  process.exit(1);
}

const [firstName, lastName, roleCode, adminToken] = args;
changeUserRoleAPI(firstName, lastName, roleCode, adminToken);

