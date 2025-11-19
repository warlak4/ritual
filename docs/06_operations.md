# Эксплуатация и DevOps

## 1. Запуск окружения

### 1.1 Локально (Node + SQL Server в Docker)
```bash
# БД:
docker compose -f ops/docker-compose.yml up -d sqlserver redis minio

# Backend:
cd backend
cp .env.example .env
npm install
npm run start:dev

# Frontend:
cd ../frontend
npm install
npm run dev
```

### 1.2 Полный стек в Docker
```bash
docker compose -f ops/docker-compose.yml up --build
# API → http://localhost:3000
# Frontend → http://localhost:5173
```

## 2. Миграции и сиды
- Миграции TypeORM генерируются в `backend/src/database/migrations`.
- Применение: `npm run typeorm:migrate`.
- Первичное наполнение (SQL):
  ```bash
  sqlcmd -S localhost,1433 -U sa -P "YourStrong!Passw0rd" -i db/scripts/00_prerequisites.sql
  sqlcmd -S localhost,1433 -U sa -P "YourStrong!Passw0rd" -i db/scripts/01_tables.sql
  ...
  sqlcmd -S localhost,1433 -U sa -P "YourStrong!Passw0rd" -i db/scripts/06_seed.sql
  ```

## 3. Резервное копирование

Скрипт `db/scripts/07_backup.sql` выполняет Full + Diff + Log backup:

```sql
USE master;
DECLARE @BackupPath NVARCHAR(400) = N'/var/opt/mssql/backups';
EXEC RitualDB.admin.sp_register_backup ...;
```

В Docker volume `sqlserver_data` автоматически хранит `.bak`/`.trn`. Сервис `admin.backup_jobs` фиксирует статус.

Рекомендованный график:
- Full backup ежедневно в 02:00.
- Diff каждые 6 часов.
- Log каждые 30 минут.

## 4. Восстановление

Скрипт `db/scripts/08_restore.sql`:
```sql
USE master;
ALTER DATABASE RitualDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE RitualDB FROM DISK = ... WITH NORECOVERY;
RESTORE DATABASE RitualDB FROM DISK = ... WITH NORECOVERY;
RESTORE LOG RitualDB FROM DISK = ... WITH RECOVERY;
ALTER DATABASE RitualDB SET MULTI_USER;
```

После восстановления прогоняем smoke-тесты:
1. `SELECT COUNT(*) FROM domain.orders;` (сравнение с эталоном).
2. `EXEC domain.sp_register_payment` (пробный платёж).
3. UI: проверка логина и отображения отчётов.

## 5. Мониторинг и логи

Backend:
- Pino logger, вывод в STDOUT (Docker). В проде → Loki/ELK.
- Audit лог в `audit.audit_log` (триггер `trg_orders_audit`).
- Метрики: `/metrics` (если подключён модуль Prometheus).

Frontend:
- Sentry (опционально) через окружение `VITE_SENTRY_DSN`.

Infra:
- Redis и MinIO можно мониторить через `redis-cli` и `mc admin info`.
- Рекомендуется зонд готовности `GET /health` (backend) и статичный файл `index.html` (frontend).

## 6. CI/CD рекомендации

- GitHub Actions:
  1. Линтеры (`npm run lint`).
  2. Unit + e2e тесты.
  3. `docker build` backend/frontend.
  4. Push образов в Registry (`ritual-api`, `ritual-web`).
- Деплой (прод):
  - Backend: Azure App Service / Kubernetes (образ + секреты).
  - Frontend: Azure Static Web Apps / S3 + CloudFront.
  - БД: Azure SQL Managed Instance или on-premises SQL Server.

## 7. Секреты и конфигурация
- `.env` (локально) — не коммитим.
- `JWT_SECRET`, `DB_PASSWORD`, `CRYPTO_MASTER_KEY` передаются через секреты CI/CD.
- В Docker Compose используются значения по умолчанию → заменить для продакшна.

## 8. Обновления и миграции
- Для изменения схемы → TypeORM migration + SQL-скрипт (если требуется процедура/триггер).
- Перед выкатыванием:
  1. Создать snapshot БД.
  2. Прогнать миграции на staging.
  3. Выполнить smoke-тесты.
- Rollback: `docker compose down`, восстановление бэкапа + откат миграций (`typeorm migration:revert`).

