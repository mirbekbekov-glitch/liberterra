# Удалённые Worker, 18 ноября 2026

Владелец попросил убрать из аккаунта Cloudflare воркеры, которые мешали. Здесь их код и настройки на момент удаления, чтобы решение было обратимым.

| Воркер | Последнее изменение | Байт | SHA-256 тела |
| --- | ---: | ---: | --- |
| `liberterra-api-synthetic-staging` | 2026-10-21 12:38 UTC | 13 847 | `7806f7365ed3b935…` |
| `liberterra-integrated-staging` | 2026-10-21 12:49 UTC | 1 723 342 | `8c02a2a322955052…` |
| `liberterra-release-overlay-staging` | 2026-10-21 20:54 UTC | 1 700 284 | `37d06ab032b2e86a…` |
| `liberterra-migration-sandbox` | 2026-11-06 06:35 UTC | 751 259 | `cdce3b4ad74a2a33…` |

Три `*-staging` остались от выпуска 21 октября, `migration-sandbox` — от переноса 6 ноября. На момент удаления проверено: ни один воркер аккаунта не держал на них сервис-привязки (единственная в аккаунте — `liberterra-listing-ui` → `hidden-pine-cbff`), расписаний у них не было. Боевые суммы после удаления не изменились, сайт отвечал 200.

## Чего здесь нет

**Значений секретов.** Cloudflare не отдаёт `secret_text` через API — в `liberterra-migration-sandbox.settings.json` у `SANDBOX_SHARED_SECRET` есть только имя. При восстановлении его придётся задать заново, прежнее значение не сохранилось нигде.

**Маршрутов на домене.** У токена этой сессии нет доступа к зоне `liberterra.kg`, поэтому список маршрутов снять не удалось. Если на какой-то из воркеров вёл поддомен, после удаления он перестал отвечать; видно в Cloudflare → Workers & Pages → Routes.

`durable_object_namespace` в настройках ссылается на пространства имён, которые удалением воркера не затронуты.

## Как восстановить

```
ACC=c94bdedbc72dfa6205338f6b0c47f22c
cat > /tmp/meta.json <<'JSON'
{"main_module":"worker.mjs","compatibility_date":"2026-07-03","compatibility_flags":[],"bindings":[]}
JSON
curl -sS -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACC/workers/scripts/<имя>" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -F "metadata=@/tmp/meta.json;type=application/json" \
  -F "worker.mjs=@archive/deleted-workers-2026-11-18/<имя>.mjs;filename=worker.mjs;type=application/javascript+module"
```

`bindings` возьмите из соответствующего `*.settings.json`, добавив значение секрета. `compatibility_date` в файле настроек тоже есть — сверьтесь с ним, прежде чем копировать значение из примера.

Папка лежит вне `platform/`, поэтому в `provenance.json`, сборку и `verify-source` не входит: это архив, а не часть выпуска.
