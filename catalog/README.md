# Новый каталог Liberterra

Отдельный Worker `liberterra-catalog`. Старая платформа (`liberterra-listing-ui`,
`hidden-pine-cbff`) не затрагивается: новый сайт только читает её публичную
выгрузку по HTTP.

Адрес для проверки: https://liberterra-catalog.mirbekbekov.workers.dev
Домен liberterra.kg пока обслуживает старый сайт.

## Файлы

| файл | что внутри |
|---|---|
| `worker.mjs` | маршруты: `/`, `/o/<id>`, `/agents`, `/api/listings`, `/healthz` |
| `data.mjs` | разбор CSV и приведение объявления к одному виду |
| `views.mjs` | разметка списка, карточки объекта и страницы агентов |
| `page.mjs` | каркас страницы, стили, логотип |
| `serve.mjs` | локальный прогон на http://localhost:8787 с сохранённым CSV |
| `meta.json` | метаданные для выкладки |

## Данные

Источник — `https://liberterra.kg/api/public-catalog` (CSV), переопределяется
переменной `CATALOG_SOURCE`. Агенты — `/api/public-agents`, переменная
`AGENTS_SOURCE`. Ответ кешируется в памяти Worker на 2 минуты.

Строки с типом сделки «Запрос» — это заявки покупателей, не объекты; в каталог
они не попадают. На 21 ноября 2026 в выгрузке 280 строк, из них объявлений два.

## Выкладка

    curl -X PUT "https://api.cloudflare.com/client/v4/accounts/<account>/workers/scripts/liberterra-catalog" \
      -F "metadata=@meta.json;type=application/json" \
      -F "worker.mjs=@worker.mjs;filename=worker.mjs;type=application/javascript+module" \
      -F "data.mjs=@data.mjs;filename=data.mjs;type=application/javascript+module" \
      -F "views.mjs=@views.mjs;filename=views.mjs;type=application/javascript+module" \
      -F "page.mjs=@page.mjs;filename=page.mjs;type=application/javascript+module"

## Что ещё не сделано

- наполнение: объявлений в базе почти нет, каталог ждёт данных;
- карта, избранное, сортировка, страница подачи объявления;
- перевод домена: когда новый сайт примут, на liberterra.kg ставится маршрут
  на этот Worker, старый снимается с домена и сохраняется.
