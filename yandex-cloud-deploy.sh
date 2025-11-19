#!/bin/bash
# Скрипт для деплоя на Yandex Cloud

echo "🚀 Деплой проекта Ritual на Yandex Cloud"

# Проверка установки Yandex CLI
if ! command -v yc &> /dev/null; then
    echo "❌ Yandex CLI не установлен. Установите:"
    echo "curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash"
    exit 1
fi

# Создание VM для backend
echo "📦 Создание VM для backend..."
yc compute instance create \
  --name ritual-backend \
  --zone ru-central1-a \
  --network-interface subnet-name=default-ru-central1-a,nat-ip-version=ipv4 \
  --create-boot-disk image-folder-id=standard-images,image-family=ubuntu-2204,size=20 \
  --memory 2GB \
  --cores 2 \
  --ssh-key ~/.ssh/id_rsa.pub

echo "✅ VM создана. Подключитесь по SSH и выполните:"
echo "git clone https://github.com/warlak4/ritual.git"
echo "cd ritual"
echo "docker-compose -f ops/docker-compose.yml up -d"

