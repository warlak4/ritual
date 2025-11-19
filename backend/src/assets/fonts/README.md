# Шрифты для поддержки кириллицы в PDF

Для правильного отображения кириллицы в PDF файлах необходимо добавить шрифты с поддержкой кириллических символов.

## Инструкция по установке

1. Скачайте шрифты DejaVu Sans:
   - DejaVuSans.ttf: https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf
   - DejaVuSans-Bold.ttf: https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf

2. Поместите файлы в эту директорию:
   - `backend/src/assets/fonts/DejaVuSans.ttf`
   - `backend/src/assets/fonts/DejaVuSans-Bold.ttf`

3. Пересоберите Docker образ:
   ```bash
   cd ops
   docker-compose build --no-cache backend
   docker-compose up -d backend
   ```

## Альтернативные шрифты

Вы можете использовать любые другие шрифты с поддержкой кириллицы:
- Roboto (Google Fonts)
- Open Sans (Google Fonts)
- Times New Roman (если есть лицензия)

Просто замените имена файлов в коде `telegram.service.ts`.

