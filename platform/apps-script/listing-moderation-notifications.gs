// Independent time trigger: does not modify listings or require a web deployment.
function installListingModerationNotifications() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('BOT_TOKEN') || !props.getProperty('ADMIN_CHAT_ID')) {
    throw new Error('BOT_TOKEN or ADMIN_CHAT_ID is missing');
  }
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Open the bound spreadsheet project');
  props.setProperty('LISTING_NOTICE_SPREADSHEET_ID', book.getId());
  listingNoticeSend_('🔔 Liberterra: уведомления о новых объявлениях на проверке подключены. Проверка каждые 5 минут.');
  if (!ScriptApp.getProjectTriggers().some(function(t) { return t.getHandlerFunction() === 'dispatchListingModerationNotifications'; })) {
    ScriptApp.newTrigger('dispatchListingModerationNotifications').timeBased().everyMinutes(5).create();
  }
  console.log('Listing moderation notification trigger installed');
  dispatchListingModerationNotifications();
}

function dispatchListingModerationNotifications() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const book = SpreadsheetApp.openById(props.getProperty('LISTING_NOTICE_SPREADSHEET_ID'));
    const sheet = book.getSheetByName('Объекты');
    if (!sheet) throw new Error('Objects sheet missing');
    const rows = sheet.getDataRange().getDisplayValues();
    const headers = rows.shift() || [];
    const idx = function(name) { const i = headers.indexOf(name); if (i < 0) throw new Error('Missing column: ' + name); return i; };
    const idCol = idx('id'), statusCol = idx('status'), titleCol = idx('title'), districtCol = idx('district'), priceCol = idx('price');
    let count = 0;
    for (let i = 0; i < rows.length && count < 5; i++) {
      const row = rows[i], id = row[idCol].trim();
      if (!/^site-[0-9a-f-]{36}$/i.test(id) || row[statusCol].trim().toLowerCase() !== 'на модерации') continue;
      const key = 'LISTING_NOTICE_SENT_' + id;
      if (props.getProperty(key)) continue;
      const url = book.getUrl() + '#gid=' + sheet.getSheetId() + '&range=A' + (i + 2);
      const text = ['🏠 Объявление с сайта ожидает вашей проверки',
        'Название: ' + row[titleCol].slice(0, 160),
        'Район: ' + row[districtCol].slice(0, 160),
        'Цена: ' + row[priceCol].slice(0, 80),
        'ID: ' + id, '', 'Открыть запись в таблице:', url,
        '', 'Объявление ещё не опубликовано. Решение принимает администратор.'].join('\n');
      listingNoticeSend_(text);
      // Mark only after Telegram confirms receipt; failed attempts retry next run.
      props.setProperty(key, new Date().toISOString());
      count++;
    }
    console.log('Listing notifications delivered: ' + count);
  } finally { lock.releaseLock(); }
}

function listingNoticeSend_(text) {
  const props = PropertiesService.getScriptProperties();
  const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + props.getProperty('BOT_TOKEN') + '/sendMessage', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({chat_id: props.getProperty('ADMIN_CHAT_ID'), text: text, disable_web_page_preview: true})
  });
  let result;
  try { result = JSON.parse(response.getContentText()); } catch (_) { throw new Error('Telegram returned invalid response'); }
  if (response.getResponseCode() !== 200 || !result.ok) throw new Error('Telegram notification failed: HTTP ' + response.getResponseCode());
}
