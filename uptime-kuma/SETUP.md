# Uptime Kuma — мониторинг Quillon

Self-hosted мониторинг доступности всех сервисов Quillon. Хостится на том же сервере, что и quillon.ru. Доступ через `https://status.quillon.ru`.

## Что мониторит (рекомендуемый набор)

- `https://quillon.ru/` — главная
- `https://quillon.ru/support/`
- `https://quillon.ru/blog/`
- `https://quillon.ru/quiz/`
- `https://tech.quillon.ru/`
- `https://tech.quillon.ru/career/`
- `https://meet.quillon.ru/` — если в проде
- `https://lms.quillon.ru/` — если в проде
- `https://b24-o95wtq.bitrix24.ru/rest/1/.../crm.lead.fields.json` — Bitrix endpoint (форма)

## Первый запуск (5 шагов, ~20 минут)

### 1. DNS

В панели DNS-провайдера добавить запись:
```
status.quillon.ru.    A    178.130.63.144
```
Подождать 1-5 минут на propagation. Проверка: `dig status.quillon.ru +short` должен вернуть IP.

### 2. На сервере: подложить файлы и запустить контейнер

```bash
ssh quillon-server
sudo mkdir -p /opt/uptime-kuma
sudo chown $USER:$USER /opt/uptime-kuma
cd /opt/uptime-kuma

# Скачать актуальный docker-compose.yml из репо
curl -O https://raw.githubusercontent.com/Quillon-AI/quillon/main/uptime-kuma/docker-compose.yml

# Запустить
docker compose up -d

# Проверить что слушает
ss -tlnp | grep 3011    # должен быть 127.0.0.1:3011 (3001 занят quillon-meet-web)
docker compose logs --tail 20
```

### 3. На сервере: установить nginx-конфиг

```bash
# Скачать nginx-конфиг
curl -o /tmp/status.nginx https://raw.githubusercontent.com/Quillon-AI/quillon/main/uptime-kuma/status.quillon.ru.nginx

sudo install -m 644 /tmp/status.nginx /etc/nginx/sites-available/status.quillon.ru
sudo ln -s ../sites-available/status.quillon.ru /etc/nginx/sites-enabled/

# Сначала ВРЕМЕННО отключаем SSL, чтобы certbot мог пройти ACME-челлендж по 80/HTTP
# (или используем certbot --nginx, который сам всё сделает — см. ниже)
```

### 4. SSL через certbot (Let's Encrypt)

```bash
# Если ещё не установлен:
sudo apt install certbot python3-certbot-nginx

# Выпустить сертификат и автоматически прописать в nginx
sudo certbot --nginx -d status.quillon.ru

# Сертификат будет авто-обновляться через systemd-таймер.
# Проверка:
sudo systemctl list-timers | grep certbot
```

### 5. Открыть UI и создать админ-аккаунт

Открыть в браузере: `https://status.quillon.ru`

При первом заходе — экран создания админа. Записать пароль в 1Password. После — добавить мониторы.

## Добавление мониторов (через UI)

1. **Add New Monitor** → выбрать тип:
   - **HTTP(s)** для веб-страниц (response time + status code)
   - **Keyword** для проверки конкретного текста на странице (например, "Quillon")
   - **Push** если хочется чтобы сервис сам пинговал (для backend cron-задач)

2. Настройки по умолчанию:
   - Heartbeat Interval: **60 секунд**
   - Retries: 2
   - Timeout: 30 сек
   - Accepted status codes: 200-299

3. **Notifications** → добавить Telegram-бот:
   - Создать бота через @BotFather
   - Получить chat_id (переслать сообщение боту, потом GET getUpdates)
   - В Uptime Kuma: Settings → Notifications → New → Telegram

## Status Page (публичная страница)

Settings → Status Pages → New Status Page
- Slug: `quillon`
- URL: `https://status.quillon.ru/status/quillon`
- Можно прикрепить custom domain если хочешь корневой `https://status.quillon.ru/`

## Бэкап Uptime Kuma data

```bash
# Снапшот
cd /opt/uptime-kuma
tar czf /var/backups/uptime-kuma-$(date +%F).tar.gz data/

# Cron — еженедельно
echo "0 3 * * 0 cd /opt/uptime-kuma && tar czf /var/backups/uptime-kuma-\$(date +\\%F).tar.gz data/" | sudo tee -a /etc/cron.d/uptime-kuma-backup
```

## Обновление до новой версии

```bash
cd /opt/uptime-kuma
docker compose pull
docker compose up -d
```

## Troubleshooting

| Симптом | Решение |
|---|---|
| `connection refused` на 3001 | `docker compose ps` → проверить что healthy. `docker compose logs` |
| 502 на status.quillon.ru | nginx не может достучаться до Kuma. Проверить порт `ss -tlnp \| grep 3001` |
| WebSocket не работает | в nginx-конфиге `proxy_set_header Upgrade $http_upgrade` обязателен |
| SSL ошибка | `sudo certbot renew --dry-run` для проверки |
