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

## Звонки в карточке сделки (CRM)
Исходники кабинета лежат в ветке `crm/production-baseline-20261027` (каталог `platform/`). Изменения оформлены патчем `crm-patch/deal-card-calls.patch`:
- `apps-script/crm-workflow-server.gs`: чтение `list_crm_workflow` с `data.calls.client_id`. Сервер CRM проверяет, что клиент принадлежит агенту, и запрашивает этот Worker. Адрес и токен берутся только из Script Properties: `CALLS_API_URL` (https://liberterra-calls.<субдомен>.workers.dev) и `CALLS_API_TOKEN` (= `API_TOKEN` Worker). Агент определяется по email его веб-аккаунта, он должен совпадать с логином в «Мои Звонки».
- `features/deals.js`: раздел «Звонки» в карточке сделки (направление, дата, длительность, пометка «есть запись»). Ссылки на записи в браузер не отдаются.
- `tests/client-calls.test.cjs` и расширенный стенд: изоляция агентов, проекция полей, деградация при сбоях.

Применение (в ветке платформы), без деплоя:
```bash
git checkout crm/production-baseline-20261027
git apply calls-worker/crm-patch/deal-card-calls.patch
node --test platform/tests/client-calls.test.cjs
node platform/scripts/build.cjs
```
Публикация изменений в production (Apps Script и Worker) требует отдельного решения владельца, см. `platform/AGENTS.md`. Тест `reproducible build with frozen Worker templates` падает и на чистой ветке платформы, к патчу это не относится.

## Выкатка в production (18.11.2026)
- `hidden-pine-cbff`: версия `4486d197-e470-4bee-aa04-9dbde26d1f9f` (развёртывание `5bee4c05…`) — точечная вставка блока «Звонки» из `crm-patch/deal-card-calls.patch` (только `features/deals.js`) в рабочую версию `4aa49e17-67cc-4dff-9073-bf24b6340ec4`. Привязки, секреты и настройки ассетов не менялись.
- Откат: Cloudflare → Workers → hidden-pine-cbff → Deployments → версия `4aa49e17…`.
- Рабочий бандл содержит изменения, которых нет в ветке платформы (~44 КБ). Перед следующей сборкой из исходников их нужно занести в репозиторий, иначе сборка их затрёт.
- Apps Script: версия 98 (было 97) — `crm-workflow-server` с блоком звонков, остальные 12 файлов без изменений; развёртывание «Воронка сделок» (тот же deploymentId и URL) переведено на 98. Откат: Apps Script → Развертывания → «Воронка сделок» → версия 97.
- Свойства скрипта `CALLS_API_URL` и `CALLS_API_TOKEN` задаются вручную (API их не меняет). Пока их нет, раздел «Звонки» показывает «Телефония не подключена».
