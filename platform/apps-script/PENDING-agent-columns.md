# Невыложенная правка: телефон агента и колонки агента в объектах

Пять вставок в живой проект Apps Script. **Не заменять `Код.gs` целиком копией из этой папки:**
снимок в репозитории отстаёт от живого проекта (см. «Снимок неполный» ниже), замена удалит
работающие действия.

Якоря ниже взяты из снимка `Code.gs` в этой папке. Если в живом файле строка-якорь отличается,
вставку надо положить по смыслу в ту же функцию, а не искать точное совпадение.

## Зачем

`agentRecordById_` не возвращает `phone`, хотя лист агентов хранит колонку «Телефон». Следствия:

- `appendObject_` считает `agentPhone` из `agent.phone === undefined`, `isValidWorkPhone_` не
  проходит — в объявление, размещённое через Telegram, всегда пишется пустой
  `listing_agent_phone`. На 17 ноября в фиде 279 объектов, телефон заполнен у одного, и тот
  пришёл с веб-пути, где берётся `actor.phone`.
- `getPublicObjectAgent_` по той же причине не отдаёт телефон агента на странице объекта, хотя
  режим `agent_private_v1` ровно это и предполагает.

Колонок `listing_agent_name` и `listing_agent_agency` в объектах нет вовсе, поэтому фильтр
каталога «Моей организации» не может работать: агентство берётся из реестра по имени агента, а
имени в фиде нет. `contact_name` держит контакт собственника (`.`, `A`, эмодзи) и агента не
определяет.

## Вставка 1 — `OBJECT_HEADERS`

После строки:

```js
  "listing_agent_phone", "contact_privacy_mode",
```

добавить:

```js
  "listing_agent_name", "listing_agent_agency",
```

Обе колонки не входят в `PRIVATE_CONTRACT_HEADERS`, значит попадают и в `PUBLIC_OBJECT_HEADERS`,
и в публикуемый CSV. `ensureHeaders_` допишет их в лист сам при первой записи.

## Вставка 2 — `agentRecordById_`

После строки:

```js
    agency: cleanText_(values[headerMap["Агентство"] - 1]),
```

добавить:

```js
    phone: cleanText_(values[headerMap["Телефон"] - 1]),
```

## Вставка 3 — `appendObject_`

После строки:

```js
    safeRow.listing_agent_phone = agentPhone;
```

добавить:

```js
    safeRow.listing_agent_name = agent && agent.role === "approved" ? cleanText_(agent.name) : "";
    safeRow.listing_agent_agency = agent && agent.role === "approved" ? cleanText_(agent.agency) : "";
```

## Вставка 4 — `persistWebListing_`

После строки:

```js
    const urls = storeWebListingPhotos_(id,decoded);
```

добавить:

```js
    const actorAgent = agentRecordById_(actor.telegramId);
```

Затем в объекте `row` заменить последнюю строку

```js
      contact_name:actor.name,public_contact_phone:actor.phone,listing_agent_phone:actor.phone,phone:""};
```

на

```js
      contact_name:actor.name,public_contact_phone:actor.phone,listing_agent_phone:actor.phone,phone:"",
      listing_agent_name:actorAgent && actorAgent.role === "approved" ? cleanText_(actorAgent.name) : "",
      listing_agent_agency:actorAgent && actorAgent.role === "approved" ? cleanText_(actorAgent.agency) : ""};
```

Условие `role === "approved"` обязательно: без него в `listing_agent_name` попадёт имя
собственника, и собственник окажется в списке сотрудников фильтра.

## Вставка 5 — разовое дозаполнение

Добавить функцию рядом с остальными `backfill*`, запустить один раз в редакторе Apps Script
после выкладки новой версии веб-приложения. Заполняет имя, агентство и пустой телефон по связи
объект→агент; объявления без связи с агентом не трогает. В логе — `{"ok":true,"updated":N,"unlinked":M}`.

```js
/**
 * One-time repair for listings published before listing_agent_name and
 * listing_agent_agency existed. Fills both columns (and listing_agent_phone
 * when it is empty) from the agent linked to the object.
 * Run this function manually in Apps Script after deploying this version.
 */
function backfillListingAgentColumns() {
  const objectsSheet = getObjectsSheet_();
  const objectHeaderMap = ensureHeaders_(objectsSheet, OBJECT_HEADERS);
  const objectRows = sheetRowsAsObjects_(objectsSheet, OBJECT_HEADERS);
  const links = objectAgentLinks_();
  const agentCache = {};

  let updated = 0;
  let unlinked = 0;
  objectRows.forEach((record) => {
    const agentId = listingAgentIdForObject_(record.id, links);
    if (!agentId) {
      unlinked += 1;
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(agentCache, agentId)) {
      agentCache[agentId] = agentRecordById_(agentId);
    }
    const agent = agentCache[agentId];
    if (!agent || agent.role !== "approved") {
      unlinked += 1;
      return;
    }
    let touched = false;
    if (objectHeaderMap.listing_agent_name && cleanText_(record.listing_agent_name) !== cleanText_(agent.name)) {
      objectsSheet.getRange(record._row, objectHeaderMap.listing_agent_name).setValue(safeSheetValue_(agent.name));
      touched = true;
    }
    if (objectHeaderMap.listing_agent_agency && cleanText_(record.listing_agent_agency) !== cleanText_(agent.agency)) {
      objectsSheet.getRange(record._row, objectHeaderMap.listing_agent_agency).setValue(safeSheetValue_(agent.agency));
      touched = true;
    }
    if (objectHeaderMap.listing_agent_phone && !cleanText_(record.listing_agent_phone) && isValidWorkPhone_(agent.phone)) {
      objectsSheet.getRange(record._row, objectHeaderMap.listing_agent_phone).setValue(safeSheetValue_(agent.phone));
      touched = true;
    }
    if (touched) updated += 1;
  });

  SpreadsheetApp.flush();
  const result = { ok: true, updated: updated, unlinked: unlinked };
  console.log(JSON.stringify(result));
  return result;
}
```

## Проверка после применения

1. В `https://liberterra.kg/api/public-catalog` появились колонки `listing_agent_name` и
   `listing_agent_agency`.
2. В каталоге под агентом «Моей организации» находит объявления его компании, в списке
   сотрудников появились имена.
3. На странице объекта, размещённого агентом, виден телефон агента.

## Что меняется для посетителя

В публичный CSV добавляются имя и агентство агента — обе величины и так публичны в реестре
`/api/public-agents`, а карточка объекта уже показывает «Агентское · Компания …». На странице
агентского объекта появляется телефон агента; это поведение, заложенное режимом
`agent_private_v1`, а не новое раскрытие.

## Снимок неполный

`Code.gs` в этой папке — снимок, снятый через выгрузку, и он отстаёт от живого проекта: владелец
правит Apps Script вручную. Проверено 17 ноября по активным воркерам: живой backend пересылает в
Apps Script действия `update_user_profile`, `profile_email_start`, `profile_email_verify`,
`set_agent_photo`, `submit_certificate_review`, `list_certificate_reviews`,
`decide_certificate_review`, а живой site вызывает ещё `save_registration_role`,
`submit_web_agent_application`, `check_agent_web`, `create_service_request`,
`list_service_requests`, `get_team_first_response`. Ни одного из них в снимке нет:

```
grep -c update_user_profile platform/apps-script/Code.gs   # 0
```

Поэтому замена живого `Код.gs` файлом из репозитория убирает работающие возможности — правки
вносятся только точечно. Единственный способ выровнять снимок — получить полный текст живого
проекта и перезахватить.
