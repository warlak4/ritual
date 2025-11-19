# Архитектура системы "Ритуаль"

## Общий обзор
- **Frontend**: SPA на React + Vite, TypeScript, i18next, Zustand для state, React Query для данных.
- **Backend**: Node.js (NestJS), TypeScript, TypeORM (SQL Server), REST API + OpenAPI, JWT аутентификация, RBAC middleware.
- **Database**: Microsoft SQL Server 2022 (Docker), полная схема из `db/`.
- **Storage**: Файлы документов в Azure Blob/S3-совместимом хранилище (локально — MinIO контейнер).
- **Messaging**: встроенные события с помощью BullMQ/Redis (уведомления, фоновые задачи).
- **CI/CD**: GitHub Actions (lint, тесты, docker build). Docker Compose для локального развёртывания.

## Слои backend
1. **API Layer** (Controllers): REST endpoints, JSON responses, DTO validation (class-validator).
2. **Application Layer** (Services): бизнес-логика, транзакции, orchestration.
3. **Domain Layer**: сущности, агрегаты, политики.
4. **Infrastructure Layer**: TypeORM репозитории, интеграции (SMTP, платежи, хранилище), адаптеры шифрования.
5. **Security Layer**: JWT, RBAC, audit hooks, rate limiting, input sanitization.

## Основные сервисы
- `AuthService`: регистрация, вход, refresh токены, забытый пароль, MFA (опционально).
- `OrderService`: CRUD заявок, расчёт стоимости, взаимодействие с пакетами услуг.
- `CeremonyService`: управление расписанием, назначение ресурсов, проверка коллизий.
- `ResourceService`: транспорт, инвентарь, персонал, API для бронирований.
- `BillingService`: платежи, квитанции, интеграция с платёжным шлюзом (эмулятор).
- `AnalyticsService`: агрегации, отчёты, экспорт CSV/PNG.
- `BackupService`: запуск и мониторинг резервного копирования.

## Интерфейс frontend
- **Layout**: адаптивная сетка (≥3 брейкпоинта), BrandBook (цвета: глубокий синий, серебристый, золотистый акцент), шрифт Playfair Display + Inter.
- **Основные экраны**:
  - Дашборд: свод по активным заказам, напоминания, графики.
  - Заявки: список, фильтры, CRUD, таймлайн.
  - Церемонии: календарь/день/неделя, назначение ресурсов.
  - Справочники: услуги, пакеты, персонал, транспорт, инвентарь.
  - Финансы: платежи, счета, отчёты.
  - Настройки пользователя: язык, тема, формат.
- **Горячие клавиши**: `Ctrl+N` (новая заявка), `Ctrl+F` (поиск), `Shift+L` (смена языка), `Shift+T` (смена темы), `Ctrl+S` (сохранить), `Ctrl+Shift+F` (сохранить фильтр), `Ctrl+Shift+A` (перейти в аналитику), `Ctrl+Shift+O` (открыть расписание).

## Безопасность
- JWT access (15 мин) + refresh (7 дней).
- Пароли: bcrypt (cost ≥ 12).
- Секреты: `.env`, хранение в Docker secrets (production), локально — `.env` (в `.gitignore`).
- Шифрование: поля клиентов через Always Encrypted (SQL Server) / симметричный ключ (AES-256) в приложении.
- RBAC: роли `admin`, `client`, `guest` с granular permissions.
- Audit Trail: middleware фиксирует request context → `audit_log`.
- Data Protection: TLS (локально через mkcert), HTTP security headers, CSP.

## DevOps
- **Docker Compose** сервисы:
  - `api` — NestJS.
  - `frontend` — Vite dev server / nginx (prod).
  - `sqlserver` — Microsoft SQL Server.
  - `redis` — для очередей и кэша.
  - `minio` — хранение файлов.
- **Make/PowerShell scripts**: миграции, seed, бэкап/restore, тесты.

## Логирование и мониторинг
- Backend: Pino logger → Loki (опционально).
- Audit + error logs → SQL + файловое хранилище.
- Метрики: Prometheus endpoint, Grafana dashboards.

## Тестирование
- Unit (Jest) для сервисов.
- Integration (supertest) для API.
- E2E (Playwright) для UI.
- Load (k6) сценарии для массовых операций.
- Security: OWASP ZAP baseline, ручные тесты SQLi, XSS, RBAC.
- Backup restore test script.

