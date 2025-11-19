# Скрипт для запуска Telegram бота с видимыми логами
Write-Host "=== Запуск Telegram бота с логами ===" -ForegroundColor Green
Write-Host ""

# Остановка старых процессов
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Остановка старых процессов Node.js..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Переход в директорию backend
Set-Location "$PSScriptRoot"

# Проверка .env файла
if (Test-Path ".env") {
    Write-Host "✅ .env файл найден" -ForegroundColor Green
    $telegramToken = (Get-Content .env | Select-String "TELEGRAM_BOT_TOKEN").ToString()
    if ($telegramToken) {
        Write-Host "✅ Telegram токен настроен" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Telegram токен не найден в .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env файл не найден!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Запуск backend с логами..." -ForegroundColor Cyan
Write-Host "Ожидаемые логи:" -ForegroundColor Cyan
Write-Host "  - 'Initializing Telegram bot...'" -ForegroundColor Gray
Write-Host "  - 'Bot connected: @RitualCode_bot'" -ForegroundColor Gray
Write-Host "  - 'Telegram bot initialized successfully'" -ForegroundColor Gray
Write-Host "  - 'VerificationService установлен в TelegramService'" -ForegroundColor Gray
Write-Host ""
Write-Host "Для остановки нажмите Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Запуск backend
npm run start:dev

