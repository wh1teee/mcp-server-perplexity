#!/bin/bash

# Скрипт для релиза mcp-server-perplexity

set -e

echo "🚀 Начинаем процесс релиза..."

# Проверяем, что мы в правильной директории
if [ ! -f "perplexity-ask/package.json" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

# Переходим в директорию пакета
cd perplexity-ask

echo "📝 Проверяем статус git..."
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Ошибка: есть незафиксированные изменения"
    echo "Сначала сделайте commit всех изменений"
    exit 1
fi

echo "📦 Устанавливаем зависимости..."
npm ci

echo "🔨 Собираем проект..."
npm run build

echo "🧪 Проверяем, что проект собирается корректно..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Ошибка: файл dist/index.js не найден после сборки"
    exit 1
fi

echo "📋 Текущая версия:"
npm version --json

echo ""
echo "Выберите тип релиза:"
echo "1) patch (0.1.0 -> 0.1.1)"
echo "2) minor (0.1.0 -> 0.2.0)"  
echo "3) major (0.1.0 -> 1.0.0)"
echo "4) Отмена"

read -p "Введите номер (1-4): " choice

case $choice in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        echo "🚫 Релиз отменен"
        exit 0
        ;;
    *)
        echo "❌ Неверный выбор"
        exit 1
        ;;
esac

echo "📈 Обновляем версию ($VERSION_TYPE)..."
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)

echo "✅ Новая версия: $NEW_VERSION"

# Возвращаемся в корневую директорию для git операций
cd ..

echo "📝 Создаем commit..."
git add perplexity-ask/package.json perplexity-ask/package-lock.json
git commit -m "chore: bump version to $NEW_VERSION"

echo "🏷️  Создаем тег..."
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"

echo "⬆️  Отправляем изменения..."
git push origin main
git push origin "$NEW_VERSION"

echo ""
echo "🎉 Релиз успешно создан!"
echo "📦 Версия: $NEW_VERSION"
echo "🏷️  Тег: $NEW_VERSION"
echo ""
echo "Теперь:"
echo "1. GitHub Actions автоматически опубликует пакет на npm"
echo "2. Будет создан релиз на GitHub"
echo "3. Проверьте статус в разделе Actions вашего репозитория" 