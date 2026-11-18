// Certificate reviews are tied to the authenticated account, never to a client-supplied agent ID.
function certificateReviewAgent_(context) {
  if (context.accountType !== 'Агент') return null;
  const sheet = getAgentsSheet_();
  const headers = ensureHeaders_(sheet, AGENT_HEADERS);
  const row = context.webUserId
    ? findValueRow_(sheet, headers.web_user_id, context.webUserId)
    : findAgentRow_(sheet, headers.telegram_id, context.telegramId);
  if (!row) return null;
  const read = (field) => cleanText_(sheet.getRange(row, headers[field]).getDisplayValue());
  return { id: context.telegramId, name: read('Имя'), legalName: read('ФИО по сертификату'),
    certificate: read('Номер сертификата') };
}

function certificateReviewNumber_(value) {
  return cleanText_(value).replace(/^№\s*/u, '').replace(/\s+/g, '').toUpperCase();
}

function certificateReviewSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName('AgentRegistry');
  if (!sheet) { sheet = book.insertSheet('AgentRegistry'); sheet.appendRow(['agent_id', 'record']); }
  return sheet;
}

function certificateReviewWrite_(id, previous, next) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = certificateReviewSheet_();
  const rows = sheet.getDataRange().getDisplayValues();
  const index = rows.findIndex((row, i) => i > 0 && row[0] === id);
  let audit = book.getSheetByName('AgentRegistryAudit');
  if (!audit) { audit = book.insertSheet('AgentRegistryAudit'); audit.appendRow(['agent_id', 'previous', 'next']); }
  audit.appendRow([id, previous ? JSON.stringify(previous) : '', JSON.stringify(next)]);
  sheet.getRange(index < 0 ? sheet.getLastRow() + 1 : index + 1, 1, 1, 2)
    .setValues([[id, JSON.stringify(next)]]);
  SpreadsheetApp.flush();
}

function certificateReviewNotifyAdmin_(agent) {
  const props = PropertiesService.getScriptProperties();
  const token = cleanText_(props.getProperty('BOT_TOKEN'));
  const chat = cleanText_(props.getProperty('ADMIN_CHAT_ID'));
  if (!token || !chat) return false;
  const text = ['Новая заявка на проверку сертификата',
    'Агент: ' + agent.name,
    'ФИО по сертификату: ' + agent.legalName,
    'Номер: ' + agent.certificate,
    'Откройте кабинет администратора → «Проверка сертификатов».',
    'Сверьте номер и ФИО с официальным реестром и проверьте принадлежность аккаунта владельцу.'].join('\n');
  try {
    const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: chat, text: text }), muteHttpExceptions: true,
    });
    return response.getResponseCode() === 200;
  } catch (_) { return false; }
}

function submitCertificateReview_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const agent = certificateReviewAgent_(context);
  if (!agent) return { ok: false, error: 'agent_required' };
  if (!/^[A-Za-zА-Яа-я0-9-]{3,40}$/.test(certificateReviewNumber_(agent.certificate))
    || agent.legalName.length < 5 || agent.legalName.length > 160) {
    return { ok: false, error: 'certificate_details_required' };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'busy_retry' };
  let samePending = false;
  try {
    const previous = agentRegistryRecords_()[agent.id];
    if (previous && previous.status === 'verified'
      && certificateReviewNumber_(previous.certificate) === certificateReviewNumber_(agent.certificate)
      && cleanText_(previous.full_name).toLowerCase() === agent.legalName.toLowerCase()
      && previous.checked_identity && publicAgentRegistry_(previous)) {
      return { ok: true, status: 'verified', notification_sent: false };
    }
    samePending = Boolean(previous && previous.status === 'pending'
      && certificateReviewNumber_(previous.certificate) === certificateReviewNumber_(agent.certificate)
      && cleanText_(previous.full_name).toLowerCase() === agent.legalName.toLowerCase());
    if (!samePending) certificateReviewWrite_(agent.id, previous, {
      status: 'pending', certificate: agent.certificate, full_name: agent.legalName,
      agent_name: agent.name, requested_at: new Date().toISOString(), updated_by: agent.id,
      checked_at: '', checked_by: '', checked_identity: false,
    });
  } finally { lock.releaseLock(); }
  // A repeated submission may retry a failed notification without changing the review record.
  const sent = certificateReviewNotifyAdmin_(agent);
  return { ok: true, status: 'pending', notification_sent: sent, already_pending: samePending };
}

function listCertificateReviews_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  if (!context.isAdmin) return { ok: false, error: 'forbidden' };
  const registry = agentRegistryRecords_();
  const reviews = Object.keys(registry).map((id) => {
    const record = registry[id];
    return record && record.status === 'pending' ? {
      agent_id: id, agent_name: cleanText_(record.agent_name),
      full_name: cleanText_(record.full_name), certificate: cleanText_(record.certificate),
      requested_at: cleanText_(record.requested_at),
    } : null;
  }).filter(Boolean);
  return { ok: true, reviews: reviews };
}

function decideCertificateReview_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  if (!context.isAdmin) return { ok: false, error: 'forbidden' };
  const id = cleanText_(payload.agent_id), decision = cleanText_(payload.decision);
  if (!/^(?:\d+|web:[A-Za-z0-9_-]{8,100})$/.test(id)
    || !['verified', 'rejected'].includes(decision)) return { ok: false, error: 'invalid_decision' };
  const source = cleanText_(payload.source), reason = cleanText_(payload.reason);
  if (decision === 'verified' && (payload.checked_valid !== true || payload.checked_identity !== true
    || !/^https:\/\/www\.cci\.kg\/reestry\/[A-Za-z0-9_./%?=&-]+$/.test(source))) {
    return { ok: false, error: 'confirmation_required' };
  }
  if (reason.length > 500 || /[\u0000-\u001f]/.test(reason)) return { ok: false, error: 'invalid_reason' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'busy_retry' };
  try {
    const previous = agentRegistryRecords_()[id];
    if (!previous || previous.status !== 'pending') return { ok: false, error: 'review_not_pending' };
    const sheet = getAgentsSheet_(), headers = ensureHeaders_(sheet, AGENT_HEADERS);
    const row = id.startsWith('web:')
      ? findValueRow_(sheet, headers.web_user_id, id.slice(4))
      : findAgentRow_(sheet, headers.telegram_id, id);
    if (!row) return { ok: false, error: 'agent_not_found' };
    const currentCertificate = cleanText_(sheet.getRange(row, headers['Номер сертификата']).getDisplayValue());
    const currentName = cleanText_(sheet.getRange(row, headers['ФИО по сертификату']).getDisplayValue());
    if (certificateReviewNumber_(currentCertificate) !== certificateReviewNumber_(previous.certificate)
      || currentName.toLowerCase() !== cleanText_(previous.full_name).toLowerCase()) {
      return { ok: false, error: 'certificate_changed' };
    }
    const next = { ...previous, status: decision, source: decision === 'verified' ? source : '',
      reason: decision === 'rejected' ? reason : '', checked_valid: decision === 'verified',
      checked_identity: decision === 'verified', checked_at: new Date().toISOString(),
      checked_by: context.telegramId };
    certificateReviewWrite_(id, previous, next);
    return { ok: true, status: decision };
  } finally { lock.releaseLock(); }
}
