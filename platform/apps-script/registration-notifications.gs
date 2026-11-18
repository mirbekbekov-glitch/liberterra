// Registration notices are sent only after the account row is committed.
function sendRegistrationNotice_(key, lines, buttons) {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('BOT_TOKEN') || !props.getProperty('ADMIN_CHAT_ID')) return false;
  const noticeKey = 'REGISTRATION_NOTICE_' + key;
  if (props.getProperty(noticeKey)) return true;
  try {
    listingNoticeSend_(lines.join('\n'), buttons ? {inline_keyboard: [buttons]} : undefined);
    props.setProperty(noticeKey, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Registration notification failed: ' + error);
    return false;
  }
}

function notifyAdminAboutSiteUser_(user) {
  const id = cleanText_(user.webUserId || user.telegramId);
  if (!id) return false;
  const lines = [
    '👤 Новый пользователь Liberterra',
    'Имя: ' + cleanText_(user.name).slice(0, 120),
    'Телефон: ' + cleanText_(user.phone).slice(0, 40),
  ];
  if (user.email) lines.push('Email: ' + normalizeEmail_(user.email));
  if (user.telegramId) lines.push('Telegram ID: ' + cleanText_(user.telegramId));
  lines.push('Аккаунт активен. Решение администратора не требуется.');
  return sendRegistrationNotice_('USER_' + id, lines);
}

function notifyAdminAboutSiteAgent_(agent) {
  const id = cleanText_(agent.telegramId);
  const applicationAt = Number(agent.applicationAt);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(applicationAt) || applicationAt <= 0) return false;
  const agency = cleanText_(agent.agency);
  const company = agency && agency !== 'Частный агент';
  const lines = [
    company ? '🏢 Новая заявка представителя компании' : '🏠 Новая заявка агента',
    'Имя: ' + cleanText_(agent.fullName).slice(0, 120),
    'Компания / агентство: ' + (agency || 'Не указано'),
    'Направление: ' + cleanText_(agent.specialization),
    'Телефон: ' + cleanText_(agent.phone),
    'Telegram ID: ' + id,
    '',
    'Проверьте данные перед решением. Одобрение даёт доступ агенту; отдельный статус компании пока не создаётся.'
  ];
  const sheet = getAgentsSheet_();
  lines.push(SpreadsheetApp.getActiveSpreadsheet().getUrl() + '#gid=' + sheet.getSheetId());
  return sendRegistrationNotice_('AGENT_' + id + '_' + applicationAt, lines, [
    {text: '✅ Одобрить', callback_data: 'reg_approve:' + id + ':' + applicationAt},
    {text: '❌ Отклонить', callback_data: 'reg_reject:' + id + ':' + applicationAt}
  ]);
}

function moderateSiteAgentForBot_(payload) {
  const id = cleanText_(payload.agent_id);
  const decision = cleanText_(payload.decision).toLowerCase();
  const adminId = cleanText_(payload.admin_id);
  const applicationAt = Number(payload.application_at);
  const timestamp = Number(payload.timestamp);
  const canonical = ['moderate_site_agent', id, decision, adminId, applicationAt, timestamp].join('\n');
  if (!serverActionValid_(payload, canonical)) return {ok:false,error:'unauthorized_server_action'};
  if (!/^\d+$/.test(id) || !/^\d+$/.test(adminId) || !Number.isSafeInteger(applicationAt) || !['approve','reject'].includes(decision)) return {ok:false,error:'invalid_decision'};
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return {ok:false,error:'moderation_busy'};
  try {
    const sheet = getAgentsSheet_();
    const headers = ensureHeaders_(sheet, AGENT_HEADERS);
    const row = findAgentRow_(sheet, headers.telegram_id, id);
    if (!row) return {ok:false,error:'agent_not_found'};
    const submittedAt = sheet.getRange(row, headers['Дата']).getValue();
    if (!submittedAt || typeof submittedAt.getTime !== 'function' || submittedAt.getTime() !== applicationAt) return {ok:false,error:'application_changed'};
    const status = sheet.getRange(row, headers['Статус']).getDisplayValue();
    if (roleFromStatus_(status) !== 'pending') return {ok:false,error:'already_processed',status:status};
    const next = decision === 'approve' ? 'одобрен' : 'отклонен';
    sheet.getRange(row, headers['Статус']).setValue(next);
    return {ok:true,agent_id:id,status:next};
  } finally { lock.releaseLock(); }
}
