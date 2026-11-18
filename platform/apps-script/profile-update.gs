function profileCertificateForContext_(context) {
  const sheet = getAgentsSheet_();
  const headers = ensureHeaders_(sheet, AGENT_HEADERS);
  let row = context.webUserId
    ? findValueRow_(sheet, headers.web_user_id, context.webUserId)
    : findAgentRow_(sheet, headers.telegram_id, context.telegramId);
  if (!row) return '';
  return cleanText_(sheet.getRange(row, headers['Номер сертификата']).getDisplayValue());
}

function profileAgentDetailsForContext_(context) {
  const sheet = getAgentsSheet_();
  const headers = ensureHeaders_(sheet, AGENT_HEADERS);
  const row = context.webUserId
    ? findValueRow_(sheet, headers.web_user_id, context.webUserId)
    : findAgentRow_(sheet, headers.telegram_id, context.telegramId);
  if (!row) return null;
  const read = (header) => cleanText_(sheet.getRange(row, headers[header]).getDisplayValue());
  return {
    avatar_url: agentAvatarUrl_(read('Публичное фото ID')),
    agency: read('Агентство'),
    experience: read('Опыт'),
    certificate_legal_name: read('ФИО по сертификату'),
    specialization: normalizeAgentSpecialization_(read('Направление')),
    role: roleFromStatus_(read('Статус')),
  };
}

function profileCertificateVerificationForContext_(context, certificateNumber) {
  if (!certificateNumber) return { status: 'unverified' };
  const record = agentRegistryRecords_()[context.telegramId];
  const legalName = profileAgentDetailsForContext_(context)?.certificate_legal_name || '';
  const normalized = (value) => cleanText_(value).replace(/^№\s*/u, '').replace(/\s+/g, '').toUpperCase();
  const nameMatches = cleanText_(record && record.full_name).toLowerCase() === cleanText_(legalName).toLowerCase();
  const legacyNameMatches = !record?.checked_identity
    && cleanText_(record && record.full_name).toLowerCase() === cleanText_(context.name).toLowerCase();
  if (!record || normalized(record.certificate) !== normalized(certificateNumber)
    || !(nameMatches || legacyNameMatches)) {
    return { status: 'unverified' };
  }
  if (record.status === 'pending') return { status: 'pending' };
  if (record.status === 'rejected') return { status: 'rejected', reason: cleanText_(record.reason) };
  if (!record.checked_identity && !legacyNameMatches) return { status: 'unverified' };
  const verified = publicAgentRegistry_(record);
  if (!verified) return { status: 'unverified' };
  return { status: 'verified', source: record.source, checked_at: record.checked_at,
    registered_name: record.full_name };
}

function updateUserProfile_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const name = cleanText_(payload.full_name);
  const phone = cleanText_(payload.phone);
  const agency = cleanText_(payload.agency);
  const specialization = cleanText_(payload.specialization);
  const experience = cleanText_(payload.experience);
  const certificateNumber = cleanText_(payload.certificate_number);
  const certificateLegalName = cleanText_(payload.certificate_legal_name);
  if (name.length < 2 || name.length > 120) return { ok: false, error: 'invalid_name' };
  if (!isValidWorkPhone_(phone)) return { ok: false, error: 'invalid_phone' };
  if (agency.length > 120) return { ok: false, error: 'invalid_agency' };
  if (specialization && !normalizeAgentSpecialization_(specialization)) return { ok: false, error: 'invalid_specialization' };
  if (payload.experience !== undefined && (experience.length > 120 || /[\r\n\u0000-\u001f]/.test(experience))) return { ok: false, error: 'invalid_experience' };
  if (payload.certificate_number !== undefined
    && (certificateNumber.length > 80 || /[\r\n\u0000-\u001f]/.test(certificateNumber))) return { ok: false, error: 'invalid_certificate_number' };
  if (payload.certificate_legal_name !== undefined
    && (certificateLegalName.length > 160 || /[\r\n\u0000-\u001f]/.test(certificateLegalName))) return { ok: false, error: 'invalid_certificate_legal_name' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'profile_busy' };
  try {
    const targets = [];
    if (context.webUserId) {
      if (!emailAuthAuthorized_(payload)) return { ok: false, error: 'unauthorized' };
      const matches = passwordAccounts_().filter((row) => cleanText_(row.web_user_id) === context.webUserId);
      const account = matches.length === 1 ? matches[0] : null;
      if (!account || !passwordAccountActive_(account, account._account_type) || !authorizedUserRow_(context.webUserId)
        || normalizeEmail_(account.Email) !== normalizeEmail_(payload.web_session_email)) return { ok: false, error: 'registration_required' };
      targets.push({ sheet: account._account_sheet, row: account._row, headers: ensureHeaders_(account._account_sheet, account._account_headers), agent: account._account_type === 'Агент' });
    } else {
      const usersSheet = getUsersSheet_();
      const userHeaders = ensureHeaders_(usersSheet, USER_HEADERS);
      const userRow = findValueRow_(usersSheet, userHeaders.telegram_id, context.telegramId);
      if (userRow) targets.push({ sheet: usersSheet, row: userRow, headers: userHeaders, agent: false });
      const agentsSheet = getAgentsSheet_();
      const agentHeaders = ensureHeaders_(agentsSheet, AGENT_HEADERS);
      const agentRow = findAgentRow_(agentsSheet, agentHeaders.telegram_id, context.telegramId);
      if (agentRow && context.accountType === 'Агент') targets.push({ sheet: agentsSheet, row: agentRow, headers: agentHeaders, agent: true });
    }
    if (!targets.length) return { ok: false, error: 'profile_not_found' };
    targets.forEach((target) => {
      const set = (header, value) => { if (target.headers[header]) target.sheet.getRange(target.row, target.headers[header]).setValue(safeSheetValue_(value)); };
      set('Имя', name);
      set('Телефон', phone);
      if (target.agent) {
        if (payload.agency !== undefined) set('Агентство', agency);
        if (payload.specialization !== undefined) set('Направление', specialization ? agentSpecializationLabel_(specialization) : '');
        if (payload.experience !== undefined) set('Опыт', experience);
        if (payload.certificate_number !== undefined) set('Номер сертификата', certificateNumber);
        if (payload.certificate_legal_name !== undefined) set('ФИО по сертификату', certificateLegalName);
      } else set('Обновлено', new Date());
    });
    if (context.webUserId) {
      const sheet = getAuthorizedUsersSheet_();
      const headers = ensureHeaders_(sheet, AUTHORIZED_USER_HEADERS);
      const row = findValueRow_(sheet, headers['ID пользователя'], context.webUserId);
      if (row) {
        sheet.getRange(row, headers['Имя']).setValue(safeSheetValue_(name));
        sheet.getRange(row, headers['Телефон']).setValue(safeSheetValue_(phone));
      }
    }
    return { ok: true };
  } finally { lock.releaseLock(); }
}


// ============================================================================
// Смена email в профиле. Код генерируется здесь и уходит письмом только на
// НОВЫЙ адрес: браузер его не знает, поэтому подтвердить смену может лишь тот,
// у кого есть доступ к новому ящику. Личность до обоих шагов проверяет
// webRegisteredUserContext_ по web_user_id из подписанной сессии Worker.
// ============================================================================

function profileAccountRow_(webUserId) {
  const userId = cleanText_(webUserId);
  if (!userId) return null;
  const candidates = [
    { sheet: getUsersSheet_(), required: USER_HEADERS },
    { sheet: getAgentsSheet_(), required: AGENT_HEADERS },
  ];
  for (let i = 0; i < candidates.length; i++) {
    const sheet = candidates[i].sheet;
    const headers = ensureHeaders_(sheet, candidates[i].required);
    if (!headers["web_user_id"]) continue;
    const rowNumber = findValueRow_(sheet, headers["web_user_id"], userId);
    if (rowNumber) return { sheet: sheet, headers: headers, row: rowNumber };
  }
  return null;
}

function profileEmailKey_(webUserId) {
  return "profile-email:" + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, cleanText_(webUserId))
  ).replace(/=+$/g, "");
}

function profileEmailCode_() {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + "\n" + String(Date.now())
  );
  let value = 0;
  for (let i = 0; i < 6; i++) value = (value * 256 + ((bytes[i] + 256) % 256)) % 1000000;
  return ("00000" + value).slice(-6);
}

function profileEmailStart_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const context = webRegisteredUserContext_(payload);
  if (!context || context.ok !== true) return { ok: false, error: "registration_required" };

  const userId = cleanText_(payload.web_user_id);
  const email = normalizeEmail_(payload.email);
  if (!userId) return { ok: false, error: "registration_required" };
  if (!email) return { ok: false, error: "invalid_email" };

  const account = profileAccountRow_(userId);
  if (!account) return { ok: false, error: "registration_required" };

  const currentEmail = normalizeEmail_(
    account.headers["Email"]
      ? account.sheet.getRange(account.row, account.headers["Email"]).getValue()
      : ""
  );
  if (email === currentEmail) return { ok: false, error: "email_unchanged" };

  const taken = passwordAccountByEmail_(email);
  if (taken && cleanText_(taken.web_user_id) !== userId) return { ok: false, error: "email_taken" };

  const cache = CacheService.getScriptCache();
  const key = profileEmailKey_(userId);
  if (cache.get(key)) return { ok: false, error: "retry_later" };

  const code = profileEmailCode_();
  cache.put(key, JSON.stringify({ hash: emailCodeHash_(email, code), email: email, attempts: 0 }), 10 * 60);
  MailApp.sendEmail({
    to: email,
    subject: "Подтверждение нового email в Liberterra",
    body: "Код для смены адреса в Liberterra: " + code
      + "\n\nКод действует 10 минут. Если вы не меняли адрес — просто не вводите его и никому не сообщайте.",
    name: "Liberterra",
  });
  return { ok: true, expires_in: 600 };
}

function profileEmailVerify_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const context = webRegisteredUserContext_(payload);
  if (!context || context.ok !== true) return { ok: false, error: "registration_required" };

  const userId = cleanText_(payload.web_user_id);
  const code = cleanText_(payload.code);
  if (!userId) return { ok: false, error: "registration_required" };
  if (!/^[0-9]{6}$/.test(code)) return { ok: false, error: "invalid_code" };

  const cache = CacheService.getScriptCache();
  const key = profileEmailKey_(userId);
  const raw = cache.get(key);
  if (!raw) return { ok: false, error: "code_expired" };

  let challenge;
  try { challenge = JSON.parse(raw); } catch (_) { cache.remove(key); return { ok: false, error: "code_expired" }; }
  if (Number(challenge.attempts || 0) >= 5) { cache.remove(key); return { ok: false, error: "too_many_attempts" }; }

  const email = normalizeEmail_(challenge.email);
  if (!email) { cache.remove(key); return { ok: false, error: "code_expired" }; }

  if (!constantTimeEqual_(emailCodeHash_(email, code), cleanText_(challenge.hash))) {
    challenge.attempts = Number(challenge.attempts || 0) + 1;
    cache.put(key, JSON.stringify(challenge), 10 * 60);
    return { ok: false, error: "invalid_code" };
  }
  cache.remove(key);

  const taken = passwordAccountByEmail_(email);
  if (taken && cleanText_(taken.web_user_id) !== userId) return { ok: false, error: "email_taken" };

  const account = profileAccountRow_(userId);
  if (!account) return { ok: false, error: "registration_required" };

  const values = account.sheet.getRange(account.row, 1, 1, account.sheet.getLastColumn()).getValues()[0];
  const now = new Date();
  const write = (header, value) => {
    if (account.headers[header]) values[account.headers[header] - 1] = safeSheetValue_(value);
  };
  write("Email", email);
  write("Email подтверждён", now);
  write("Обновлено", now);
  account.sheet.getRange(account.row, 1, 1, values.length).setValues([values]);

  const user = {};
  Object.keys(account.headers).forEach((header) => { user[header] = values[account.headers[header] - 1]; });
  user.web_user_id = userId;
  authorizeUser_(user);

  return { ok: true, email: email };
}
