# calls-worker — звонки «Мои Звонки» в сделках агентов

Cloudflare Worker + D1. Принимает событие `call.finish`, хранит звонки, отдаёт их основному бэкенду Liberterra. Не развёрнут: ниже шаги запуска. Документация API: https://www.moizvonki.ru/guide/api/

## Как это работает
1. «Мои Звонки» шлёт `POST /webhooks/moizvonki?token=…` на каждый завершённый звонок.
2. Звонок сохраняется в D1 (идемпотентно по `account_id:db_call_id`), телефон клиента нормализуется до `+996…`.
3. Каждые 15 минут крон догружает пропущенные звонки через `calls.list` (телефон мог быть без интернета).
4. Основной бэкенд после проверки сессии агента вызывает `GET /api/calls?agent=<email>&client_phone=<+996…>` с `Authorization: Bearer <API_TOKEN>` и показывает звонки в карточке клиента или сделки. Запись: `GET /api/calls/<id>/recording?agent=<email>` (поток через Worker, ссылка провайдера не раскрывается).

Агент определяется по email сотрудника в «Мои Звонки» (`webhook.user_login`). Он должен совпадать с email агента в Liberterra. Без `agent` API ничего не отдаёт.

## Запуск
```bash
cd calls-worker
npx wrangler d1 create liberterra-calls        # id вписать в wrangler.toml
npx wrangler d1 execute liberterra-calls --remote --file=schema.sql
npx wrangler secret put WEBHOOK_TOKEN          # длинная случайная строка
npx wrangler secret put API_TOKEN              # общий секрет с основным бэкендом
npx wrangler secret put MZ_API_KEY             # ключ из Настройки → Интеграция
# в wrangler.toml заполнить MZ_USER (email админа), затем:
npx wrangler deploy
```

Подписка на события (один раз, от имени админа; ключ берётся из окружения, не из истории команд):
```bash
read -rs MZ_API_KEY && export MZ_API_KEY
read -rs WEBHOOK_TOKEN && export WEBHOOK_TOKEN
curl -sS https://liberterra.moizvonki.ru/api/v1 -H 'content-type: application/json' \
  -d "{\"user_name\":\"ADMIN_EMAIL\",\"api_key\":\"$MZ_API_KEY\",\"action\":\"webhook.subscribe\",\"hooks\":{\"call.finish\":\"https://<worker-host>/webhooks/moizvonki?token=$WEBHOOK_TOKEN\"}}"
```

## Проверить до запуска
- Приходит ли `recording` на ваших телефонах, как долго живёт ссылка, нужна ли авторизация для её скачивания (документация не описывает).
- Вебхуки «Мои Звонки» не подписываются: защита только секретным `token` в URL, `WEBHOOK_TOKEN` хранить как секрет и менять при утечке.
- Предупреждение собеседнику о записи и срок хранения согласовать с юристом (закон КР о персональной информации).
