-- Заполнение мониторов в Uptime Kuma SQLite
-- Запуск: docker exec -i uptime-kuma sqlite3 /app/data/kuma.db < seed-monitors.sql
-- Идемпотентно: повторный запуск ничего не дублирует.

.mode column
.headers on
.changes on

-- 1. Главная quillon.ru
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Quillon · main', 'http', 60, 60, 2, 'https://quillon.ru/', '["200-299"]', 1, 2000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Quillon · main');

-- 2. Support
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Quillon · support', 'http', 300, 60, 2, 'https://quillon.ru/support/', '["200-299"]', 1, 2000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Quillon · support');

-- 3. Blog
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Quillon · blog', 'http', 300, 60, 2, 'https://quillon.ru/blog/', '["200-299"]', 1, 2000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Quillon · blog');

-- 4. Tracks/Python
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Quillon · tracks/python', 'http', 300, 60, 2, 'https://quillon.ru/tracks/python-backend-ml/', '["200-299"]', 1, 2000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Quillon · tracks/python');

-- 5. Tech main
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Tech · main', 'http', 60, 60, 2, 'https://tech.quillon.ru/', '["200-299"]', 1, 2000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Tech · main');

-- 6. Tech career
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Tech · career', 'http', 300, 60, 2, 'https://tech.quillon.ru/career/', '["200-299"]', 1, 2000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Tech · career');

-- 7. Tech cases
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Tech · cases', 'http', 300, 60, 2, 'https://tech.quillon.ru/cases/', '["200-299"]', 1, 2000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Tech · cases');

-- 8. Quillon Meet
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Quillon Meet', 'http', 60, 60, 2, 'https://meet.quillon.ru/', '["200-299","301","302"]', 1, 2000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Quillon Meet');

-- 9. Bitrix webhook (keyword check)
INSERT INTO monitor (name, type, interval, retry_interval, maxretries, url, keyword, accepted_statuscodes_json, active, weight, method, timeout, max_redirects, ignore_tls, upside_down, expiry_notification)
SELECT 'Bitrix24 webhook', 'keyword', 600, 120, 2, 'https://b24-o95wtq.bitrix24.ru/rest/1/6d5yns93ulwkr79s/crm.lead.fields.json', 'TITLE', '["200-299"]', 1, 1000, 'GET', 48, 10, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM monitor WHERE name='Bitrix24 webhook');

SELECT 'Total monitors:' AS info, COUNT(*) AS n FROM monitor;
SELECT id, name, type, interval FROM monitor ORDER BY id;
