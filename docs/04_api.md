# API «Ритуаль»

## Общие сведения

- Базовый URL в режиме разработки: `http://localhost:3000`.
- Аутентификация: Bearer JWT (access token, выдаётся на 15 минут).
- Спецификация доступна в Swagger UI после запуска backend: `http://localhost:3000/api/docs`.
- Все защищённые методы требуют заголовка `Authorization: Bearer <token>`.

## Основные эндпоинты

### Аутентификация
| Метод | Путь              | Описание                             |
|-------|-------------------|--------------------------------------|
| POST  | `/auth/login`     | Вход по email/паролю                 |
| POST  | `/auth/register`  | Регистрация клиента                  |
| POST  | `/auth/refresh`   | Обновление пары токенов              |
| POST  | `/auth/register/admin` | Создание администратора (только admin) |
| GET   | `/auth/me`        | Текущий пользователь                 |

### Пользователи и настройки
| Метод | Путь                 | Описание                               |
|-------|----------------------|----------------------------------------|
| GET   | `/users/me`          | Профиль текущего пользователя          |
| PATCH | `/users/me/profile`  | Обновление пользовательских настроек   |
| GET   | `/users`             | Список пользователей (только admin)    |
| GET   | `/settings/preferences` | Настройки профиля                     |
| PATCH | `/settings/preferences` | Сохранение настроек (тема, язык и т.д.) |

### Клиенты и умершие
| Метод | Путь        | Описание                     |
|-------|-------------|------------------------------|
| GET   | `/clients`  | Пагинированный список клиентов |
| POST  | `/clients`  | Создание клиента (hash + шифрование выполняются на сервере) |
| GET   | `/clients/secure` | Дешифрованные данные (только admin) |

### Каталоги и пакеты услуг
| Метод | Путь                 | Описание                       |
|-------|----------------------|--------------------------------|
| GET   | `/catalog/categories`| Категории услуг                |
| GET   | `/catalog/services`  | Активные услуги                |
| GET   | `/catalog/packages`  | Пакеты услуг с составом        |

### Заявки и церемонии
| Метод | Путь                  | Описание                                          |
|-------|-----------------------|---------------------------------------------------|
| GET   | `/orders`             | Список заявок (фильтры/pagination)                |
| POST  | `/orders`             | Создание заявки через процедуру `sp_create_order` |
| PATCH | `/orders/:id/status`  | Смена статуса (admin)                             |
| GET   | `/orders/:id`         | Детальная информация                             |
| GET   | `/orders/:id/payments`| Платежи по заявке                                |
| GET   | `/ceremonies/schedule`| Расписание церемоний                             |
| POST  | `/ceremonies/:id/assign` | Назначение ресурсов (`sp_assign_ceremony_resources`) |

### Ресурсы и платежи
| Метод | Путь               | Описание                          |
|-------|--------------------|-----------------------------------|
| GET   | `/resources/staff` | Персонал                          |
| GET   | `/resources/vehicles` | Транспорт                      |
| GET   | `/resources/inventory`| Инвентарь                      |
| GET   | `/payments/order/:orderId` | Платежи по заказу         |
| POST  | `/payments`        | Регистрация платежа (`sp_register_payment`) |

### Аналитика
| Метод | Путь                | Описание                                           |
|-------|---------------------|----------------------------------------------------|
| GET   | `/analytics/dashboard` | KPI + сводные данные для главной панели        |
| GET   | `/analytics/orders` | Распределение заявок                              |
| GET   | `/analytics/financial` | Финансовые метрики                            |
| GET   | `/analytics/inventory` | Нагрузка на инвентарь                         |

## Коды ответов
- `200 OK` — успешный запрос.
- `201 Created` — успешно создан ресурс.
- `400 Bad Request` — валидационная ошибка.
- `401 Unauthorized` — отсутствует или просрочен токен.
- `403 Forbidden` — недостаточно прав (RBAC).
- `404 Not Found` — ресурс не найден.
- `422 Unprocessable Entity` — бизнес-ошибка из хранимой процедуры/триггера.
- `500 Internal Server Error` — системная ошибка.

## Примеры запросов

### Создание заявки
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "f83f9ad0-...",
  "deceasedId": "09d4f6ba-...",
  "packageId": "e2bd37bc-...",
  "currency": "RUB",
  "services": [
    { "serviceId": "1123...", "quantity": 1, "unitPrice": 75000, "discount": 0 },
    { "serviceId": "2234...", "quantity": 1, "unitPrice": 15000, "discount": 0 }
  ]
}
```

### Регистрация платежа
```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "c71b...",
  "amount": 50000,
  "currency": "RUB",
  "method": "bank_transfer",
  "transactionRef": "BANK-99101",
  "status": "paid"
}
```

## Генерация OpenAPI

В проект добавлен `@nestjs/swagger` и плагин в `nest-cli.json`. Актуальную спеку можно экспортировать:

```bash
cd backend
npm run build
node ./dist/main.js --openapi ./openapi.json
```

Файл `openapi.json` пригоден для импорта в Postman/Insomnia или генерации клиентского SDK.

