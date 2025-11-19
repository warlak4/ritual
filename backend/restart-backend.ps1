# Скрипт для перезапуска backend с проверкой конфигурации

Write-Host "Перезапуск backend..." -ForegroundColor Cyan
Write-Host ""

# Остановка старых процессов
Write-Host "Остановка старых процессов Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "Процессы остановлены" -ForegroundColor Green
} else {
    Write-Host "Процессы Node.js не найдены" -ForegroundColor Gray
}

# Проверка .env файла
Write-Host ""
Write-Host "Проверка конфигурации..." -ForegroundColor Cyan
$envPath = ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match 'TELEGRAM_CHAT_ID=7222886369') {
        Write-Host "TELEGRAM_CHAT_ID настроен правильно" -ForegroundColor Green
    } elseif ($envContent -match 'TELEGRAM_CHAT_ID=') {
        Write-Host "TELEGRAM_CHAT_ID найден, обновляю значение..." -ForegroundColor Yellow
        $envContent = $envContent -replace 'TELEGRAM_CHAT_ID=.*', 'TELEGRAM_CHAT_ID=7222886369'
        Set-Content $envPath -Value $envContent -NoNewline
        Write-Host "TELEGRAM_CHAT_ID обновлен" -ForegroundColor Green
    } else {
        Write-Host "TELEGRAM_CHAT_ID не найден, добавляю..." -ForegroundColor Yellow
        Add-Content $envPath -Value "`nTELEGRAM_CHAT_ID=7222886369"
        Write-Host "TELEGRAM_CHAT_ID добавлен" -ForegroundColor Green
    }
} else {
    Write-Host "Файл .env не найден! Создаю..." -ForegroundColor Yellow
    "TELEGRAM_BOT_TOKEN=8558062986:AAHAX6CTkUl2OIQmwAHqWC3QE25LKE2yieY`nTELEGRAM_CHAT_ID=7222886369" | Set-Content $envPath
    Write-Host ".env файл создан" -ForegroundColor Green
}

# Запуск backend
Write-Host ""
Write-Host "Запуск backend..." -ForegroundColor Cyan
Write-Host "Ожидайте сообщения о инициализации бота..." -ForegroundColor Gray
Write-Host ""

# Запускаем в новом окне PowerShell для видимости логов
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run start:dev"

Write-Host ""
Write-Host "Backend запущен в новом окне PowerShell" -ForegroundColor Green
Write-Host ""
Write-Host "Проверьте новое окно на наличие сообщений:" -ForegroundColor Cyan
Write-Host "   Manager chat ID configured: 7222886369" -ForegroundColor Gray
Write-Host "   Bot connected: @RitualCode_bot" -ForegroundColor Gray
Write-Host "   Telegram bot initialized successfully" -ForegroundColor Gray
