// The bot signs the decision only after checking the Telegram administrator ID.
function moderateSiteListingForBot_(payload) {
  const id = cleanText_(payload.object_id);
  const decision = cleanText_(payload.decision).toLowerCase();
  const reason = cleanText_(payload.reason).slice(0, 500);
  const timestamp = Number(payload.timestamp);
  const adminId = cleanText_(payload.admin_id);
  const canonical = ['moderate_site_listing', id, decision, reason, adminId, timestamp].join('\n');
  if (!serverActionValid_(payload, canonical)) return {ok:false,error:'unauthorized_server_action'};
  if (!/^\d+$/.test(adminId)) return {ok:false,error:'invalid_admin_id'};
  if (!/^site-[0-9a-f-]{36}$/i.test(id) || !['approve','reject'].includes(decision)) return {ok:false,error:'invalid_moderation_decision'};
  if (decision === 'reject' && !reason) return {ok:false,error:'rejection_reason_required'};
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return {ok:false,error:'moderation_busy'};
  try {
    const object = getObjectRecordById_(id);
    if (!object || cleanText_(object.deal).toLowerCase() === 'запрос') return {ok:false,error:'listing_not_found'};
    const currentStatus = cleanText_(object.status).toLowerCase().replace(/ё/g,'е');
    if (['на модерации','pending','moderation','проверка'].indexOf(currentStatus) === -1) return {ok:false,error:'already_processed',status:cleanText_(object.status)};
    const now = new Date();
    const changes = {id:id,status:decision === 'approve' ? 'опубликован' : 'снят',updated_at:now.toISOString()};
    if (decision === 'approve') changes.actuality_at = now.toISOString();
    upsertObjectFields_(changes,PUBLIC_OBJECT_HEADERS,object);
    const sheet = getModerationSheet_();
    const headerMap = ensureHeaders_(sheet,MODERATION_SHEET_HEADERS);
    const row = findValueRow_(sheet,headerMap['ID'],id);
    if (row) {
      sheet.getRange(row,headerMap['Решение']).setValue(decision === 'approve' ? 'Одобрить' : 'Отклонить');
      if (reason) sheet.getRange(row,headerMap['Причина отклонения']).setValue(safeSheetValue_(reason));
      sheet.getRange(row,headerMap['Результат']).setValue(decision === 'approve' ? 'Опубликовано через Telegram' : 'Отклонено через Telegram: ' + reason);
      sheet.getRange(row,headerMap['Администратор']).setValue('Telegram ID ' + cleanText_(payload.admin_id));
      sheet.getRange(row,headerMap['Обработано']).setValue(now);
    }
    return {ok:true,object_id:id,status:changes.status};
  } finally {lock.releaseLock()}
}
