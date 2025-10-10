#!/bin/bash

# Скрипт для мониторинга запуска ботов

echo "=== Мониторинг ботов Vexa ==="
echo ""

# Проверяем запущенные контейнеры ботов
echo "📦 Запущенные контейнеры ботов:"
docker ps -a --filter "name=vexa-bot" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.CreatedAt}}" | head -n 10

echo ""
echo "📊 Последние 30 строк логов bot-manager:"
docker logs vexa_dev-bot-manager-1 --tail 30

echo ""
echo "🔍 Проверка последнего запущенного бота:"
LAST_BOT=$(docker ps -a --filter "name=vexa-bot" --format "{{.ID}}" | head -n 1)

if [ -n "$LAST_BOT" ]; then
    echo "Контейнер: $LAST_BOT"
    echo ""
    echo "📋 Логи бота:"
    docker logs "$LAST_BOT" 2>&1 | tail -n 50
else
    echo "❌ Контейнеры ботов не найдены"
fi

echo ""
echo "=== Конец мониторинга ==="

