const OBJECTS_SHEET_NAME = "Объекты";
const REQUESTS_SHEET_NAME = "Заявки";
const LEGACY_COMBINED_SHEET_NAME = "Objects";
const AGENTS_SHEET_NAME = "Агенты";
const USERS_SHEET_NAME = "Пользователи";
const AUTHORIZED_USERS_SHEET_NAME = "Авторизованные пользователи";
const ACCESS_CLAIMS_SHEET_NAME = "Заявки доступа";
const USER_FAVORITES_SHEET_NAME = "Избранное";
const OBJECT_AGENT_LINKS_SHEET_NAME = "Object Agent Links";
const AGENT_NOTES_SHEET_NAME = "Agent Notes";
const AGENT_COMMENTS_SHEET_NAME = "Комментарии";
const LEGACY_AGENT_COMMENTS_SHEET_NAME = "Agent Comments";
const AGENT_CLIENTS_SHEET_NAME = "Agent Clients";
const MESSAGE_THREADS_SHEET_NAME = "Диалоги";
const MESSAGE_ENTRIES_SHEET_NAME = "Сообщения";
const COMMENT_REPORTS_SHEET_NAME = "Жалобы на комментарии";
const VISITS_SHEET_NAME = "Посещения";
const ANALYTICS_SHEET_NAME = "Статистика сайта";
const USER_ACTIVITY_SHEET_NAME = "Активность пользователей";
const MODERATION_SHEET_NAME = "На модерации";
const MODERATION_ACTIONS_SHEET_NAME = "Журнал модерации";
const AGENT_DOCUMENTS_FOLDER_NAME = "Liberterra Agent Documents";
const OWNER_CONTRACTS_FOLDER_NAME = "Liberterra Owner Contracts";
const MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60;
const MAX_DOCUMENT_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_OWNER_CONTRACT_BYTES = 8 * 1024 * 1024;
const SERVER_ACTION_MAX_AGE_SECONDS = 5 * 60;
const ANALYTICS_DASHBOARD_VERSION = "v4-daily-control";
const MAX_AGENT_COMMENT_LENGTH = 500;
const AGENT_COMMENT_RATE_LIMIT = 5;
const AGENT_COMMENT_RATE_WINDOW_MS = 60 * 1000;
const MODERATION_ACTION_LEASE_MS = 10 * 60 * 1000;
const MODERATION_ACTION_LOCK_WAIT_MS = 2000;
const MODERATION_ACTION_CLAIM_HEADER = "ID запроса получения";
const MODERATION_QUEUE_VERSION = "20260907-resilient-1";

const MODERATION_SHEET_HEADERS = [
  "ID", "Статус в Объекты", "Почему здесь", "Объект", "Сделка", "Район", "Цена", "Период / валюта",
  "Комнаты", "Площадь", "Контакт", "Телефон", "Telegram ID",
  "Создано", "Обновлено", "Фото", "Открыть объект",
  "Решение", "Причина отклонения", "Результат", "Запрошено", "Администратор", "ID операции", "Обработано"
];

const MODERATION_ACTION_HEADERS = [
  "ID операции", "ID объекта", "Решение", "Причина", "Запрошено", "Администратор",
  "Статус", "Результат", "Взято в работу", "Обработано", MODERATION_ACTION_CLAIM_HEADER
];

const AGENT_COMMISSION_CONFIG = {
  sale_rate: 0.02,
  rent_rate: 0.5,
  platform_share: 0,
  listing_share: 0.5,
  closing_share: 0.5,
};

const AGENT_TERMS_CONFIG = {
  title: "Как вы зарабатываете с Liberterra",
  intro: "Liberterra — общая база объектов для агентов. Вы работаете с любыми объектами платформы, а комиссию делят между собой агенты.",
  sections: [
    {
      title: "КАК ДЕЛИТСЯ КОМИССИЯ",
      paragraphs: ["Комиссия по сделке делится 50/50 между двумя агентами:"],
      bullets: [
        "50% — агенту, который привёл объект (разместил его в базе);",
        "50% — агенту, который закрыл сделку (привёл клиента).",
      ],
      after: [
        "Если вы ведёте объект от размещения до закрытия сами — вы получаете обе доли, 100%.",
        "Платформа на этапе запуска свою долю не удерживает — всю комиссию получают агенты.",
      ],
    },
    {
      title: "РАЗМЕР КОМИССИИ",
      bullets: [
        "Продажа — 2% от стоимости объекта.",
        "Аренда — 50% от первого месяца аренды.",
      ],
    },
    {
      title: "ПРИМЕРЫ",
      bullets: [
        "Продажа за $100 000 → комиссия $2 000. Если закрыли вы, а объект чужой — вам $1 000. Если объект ваш и сделку закрыли вы — $2 000.",
        "Аренда 45 000 сом/мес → комиссия 22 500 сом. Ваша доля за закрытие — 11 250 сом.",
      ],
    },
    {
      title: "УСЛОВИЯ РАБОТЫ",
      bullets: [
        "Зарабатывать могут только зарегистрированные агенты, прошедшие проверку Liberterra.",
        "Объект добавляется в базу только при наличии подписанного договора.",
        "По объекту указываются два контактных номера: номер агента, разместившего объект, и номер Liberterra.",
        "Комиссию получает агент, доведший клиента до сделки. Порядок распределения и выплат — в договоре с Liberterra.",
      ],
    },
  ],
};

const OBJECT_HEADERS = [
  "segment",
  "city",
  "deal",
  "rooms",
  "price",
  "per",
  "title",
  "area",
  "floor",
  "district",
  "latitude",
  "longitude",
  "verified",
  "photo_url",
  "tg_link",
  "status",
  "id",
  "phone",
  "contact_name",
  "description",
  "year",
  "documents",
  "condition",
  "land_area",
  "material",
  "occupancy_type",
  "preferred_tenant",
  "current_residents",
  "move_in_date",
  "utilities_included",
  "deposit",
  "contract_number",
  "contract_date",
  "contract_until",
  "contract_file_id",
  "contract_signed",
  "actuality_at",
  "created_at",
  "updated_at",
  "listing_agent_phone", "contact_privacy_mode",
];

const PRIVATE_CONTRACT_HEADERS = [
  "contract_number",
  "contract_date",
  "contract_until",
  "contract_file_id",
  "contract_signed",
];

const PUBLIC_OBJECT_HEADERS = OBJECT_HEADERS.filter(
  (header) => PRIVATE_CONTRACT_HEADERS.indexOf(header) === -1
);

const AGENT_HEADERS = [
  "telegram_id",
  "Имя",
  "Агентство",
  "Направление",
  "Телефон",
  "Username",
  "Опыт",
  "Документ",
  "Статус",
  "Дата",
  "Условия приняты",
  "Дата согласия",
  "Рейтинг",
  "Публичное фото ID",
  "web_user_id",
  "Email",
  "Email подтверждён",
  "password_salt",
  "password_hash",
  "password_iterations",
  "Пароль обновлён",
];

const USER_HEADERS = [
  "telegram_id", "Имя", "Телефон", "Username", "Тип", "Статус", "Дата регистрации", "Обновлено",
  "Первый вход", "Последний вход", "Посещений", "Последняя страница", "Источник", "Уведомления",
  "web_user_id", "Email", "Email подтверждён", "password_salt", "password_hash", "password_iterations", "Пароль обновлён"
];
const AUTHORIZED_USER_HEADERS = [
  "ID пользователя", "Имя", "Телефон", "Email", "Дата авторизации", "Последний вход"
];
const ACCESS_CLAIM_HEADERS = [
  "ID заявки", "telegram_id", "Имя", "Телефон", "Email", "password_salt", "password_hash",
  "password_iterations", "Статус", "Дата заявки", "Дата решения"
];
const USER_FAVORITE_HEADERS = ["telegram_id", "object_id", "created_at"];

const AGENT_NOTE_HEADERS = [
  "agent_id",
  "object_id",
  "note",
  "updated_at",
];

const AGENT_COMMENT_HEADERS = [
  "comment_id",
  "object_id",
  "agent_id",
  "agent_name",
  "text",
  "created_at",
  "edited",
];

const LEGACY_AGENT_COMMENT_HEADERS = [
  "comment_id",
  "object_id",
  "author_agent_id",
  "author_name",
  "text",
  "created_at",
  "updated_at",
  "deleted",
];

const AGENT_CLIENT_HEADERS = [
  "claim_id",
  "agent_id",
  "agent_name",
  "object_id",
  "client_label",
  "created_at",
  "status",
];
const MESSAGE_THREAD_HEADERS = [
  "thread_id", "object_id", "client_key", "agent_id", "created_at", "updated_at", "last_message_at"
];
const MESSAGE_ENTRY_HEADERS = [
  "message_id", "thread_id", "object_id", "sender_key", "recipient_key", "sender_name", "text", "created_at", "read_at"
];
const MAX_MESSAGE_LENGTH = 1200;
const MESSAGE_RATE_LIMIT = 8;
const MESSAGE_RATE_WINDOW_SECONDS = 60;
const COMMENT_REPORT_HEADERS = ["report_id", "comment_id", "object_id", "reporter_id", "created_at", "status"];

const AGENT_CRM_OBJECT_HEADERS = [
  "id",
  "segment",
  "city",
  "deal",
  "rooms",
  "price",
  "per",
  "title",
  "area",
  "floor",
  "district",
  "latitude",
  "longitude",
  "verified",
  "photo_url",
  "status",
  "description",
  "year",
  "documents",
  "condition",
  "land_area",
  "material",
  "actuality_at",
  "updated_at",
];

const REQUEST_EDIT_HEADERS = [
  "id", "rooms", "price", "title", "district", "description",
  "phone", "contact_name", "tg_link", "status", "updated_at",
];

const VISIT_HEADERS = [
  "Дата",
  "Событие",
  "Посетитель",
  "Сессия",
  "Страница",
  "Путь",
  "Источник",
  "Переход с",
  "Устройство",
  "Telegram ID",
  "Имя",
  "Телефон",
  "Username",
  "Объект",
  "Действие",
  "Кнопка",
  "Цель",
];

// Public GET is strictly read-only. Never dispatch arbitrary actions to doPost.
function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (params.action === "list_public_agents") return jsonOutput_(listPublicAgents_());
    if (params.action === "get_public_agent_objects") {
      return jsonOutput_(getPublicAgentObjects_({ agent_ref: cleanText_(params.agent_ref) }));
    }
    return jsonOutput_({ ok: false, error: "unknown_action" });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonOutput_({ ok: false, error: "server_error" });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput_({ ok: false, error: "empty_request" });
    }
    const payload = parseRequestPayload_(e);
    const action = cleanText_(payload.action).toLowerCase();
    if (["list_agent_tasks", "save_agent_task"].includes(action)) return jsonOutput_(agentTasksAction_(payload, action));
    if (["list_crm_workflow", "save_crm_record"].includes(action)) return jsonOutput_(crmWorkflowAction_(payload, action));
    if (action === "get_public_crm_selection") return jsonOutput_(getPublicCrmSelection_(payload));
    if (action === "newbuilding_consultation") return jsonOutput_(newbuildingConsultation_(payload));

    if (action === "register_agent") {
      return jsonOutput_(registerAgent_(payload));
    }

    if (action === "register_user") {
      return jsonOutput_(registerUser_(payload));
    }

    if (action === "check_user") {
      return jsonOutput_(checkUser_(payload));
    }

    if (action === "email_auth_start") return jsonOutput_(startEmailAuth_(payload));
    if (action === "email_auth_verify") return jsonOutput_(verifyEmailAuth_(payload));
    if (action === "password_register_start") return jsonOutput_(passwordRegisterStart_(payload));
    if (action === "password_register_verify") return jsonOutput_(passwordRegisterVerify_(payload));
    if (action === "password_set_start") return jsonOutput_(passwordSetStart_(payload));
    if (action === "password_set_verify") return jsonOutput_(passwordSetVerify_(payload));
    if (action === "password_claim_start") return jsonOutput_(passwordClaimStart_(payload));
    if (action === "password_claim_verify") return jsonOutput_(passwordClaimVerify_(payload));
    if (action === "telegram_password_link_start") return jsonOutput_(telegramPasswordLinkStart_(payload));
    if (action === "telegram_password_link_verify") return jsonOutput_(telegramPasswordLinkVerify_(payload));
    if (action === "password_auth_record") return jsonOutput_(passwordAuthRecord_(payload));
    if (action === "web_session_status") return jsonOutput_(webSessionStatus_(payload));
    if (action === "get_web_user_profile") return jsonOutput_(getWebUserProfile_(payload));
    if (action === "create_web_listing") return jsonOutput_(createWebListing_(payload));
    if (action === "upload_web_listing_photos") return jsonOutput_(uploadWebListingPhotos_(payload));
    if (["list_message_threads", "open_message_thread", "read_message_thread", "send_message"].includes(action)) {
      return jsonOutput_(messageAction_(payload, action));
    }

    if (action === "set_agent_photo") return jsonOutput_(setAgentPhoto_(payload));
    if (["create_viewing", "list_viewings", "update_viewing"].includes(action)) return jsonOutput_(viewingAction_(payload, action));
    if (action === "get_agent_registry") return jsonOutput_(agentRegistryAction_(payload, false));
    if (action === "set_agent_registry") return jsonOutput_(agentRegistryAction_(payload, true));
    if (action === "get_user_profile") {
      return jsonOutput_(getUserProfile_(payload));
    }

    if (action === "set_user_favorite") {
      return jsonOutput_(setUserFavorite_(payload));
    }

    if (action === "set_user_favorites") {
      return jsonOutput_(setUserFavorites_(payload));
    }

    if (action === "check_agent") {
      return jsonOutput_(checkAgent_(payload));
    }

    if (action === "set_agent_specialization") {
      return jsonOutput_(setAgentSpecialization_(payload));
    }

    if (action === "accept_agent_terms") {
      return jsonOutput_(acceptAgentTerms_(payload));
    }

    if (action === "track_page_view" || action === "track_event") {
      return jsonOutput_(trackAnalyticsEvent_(payload));
    }

    if (action === "save_object_contract") {
      return jsonOutput_(saveObjectContract_(payload));
    }

    if (action === "set_object_contract_status") {
      return jsonOutput_(setObjectContractStatus_(payload));
    }

    if (action === "set_request_created_at") {
      return jsonOutput_(setRequestCreatedAt_(payload));
    }

    if (action === "list_public_agents") {
      return jsonOutput_(listPublicAgents_());
    }

    if (action === "list_approved_agents") {
      return jsonOutput_(listApprovedAgentsForBot_(payload));
    }

    if (action === "list_registered_users") {
      return jsonOutput_(listRegisteredUsersForBot_(payload));
    }

    if (action === "get_admin_dashboard") {
      return jsonOutput_(getAdminDashboardForBot_(payload));
    }

    if (action === "claim_moderation_actions") {
      return jsonOutput_(claimModerationActionsForBot_(payload));
    }

    if (action === "moderation_queue_health") {
      return jsonOutput_(moderationQueueHealthForBot_(payload));
    }

    if (action === "complete_moderation_action") {
      return jsonOutput_(completeModerationActionForBot_(payload));
    }

    if (action === "get_agent_dashboard") {
      return jsonOutput_(getAgentDashboard_(payload));
    }

    if (action === "get_agent_private_object") {
      return jsonOutput_(getAgentPrivateObject_(payload));
    }

    if (action === "save_agent_private_object") {
      return jsonOutput_(saveAgentPrivateObject_(payload));
    }

    if (action === "request_agent_private_access") {
      return jsonOutput_(requestAgentPrivateAccess_(payload));
    }

    if (action === "list_agent_private_access") {
      return jsonOutput_(listAgentPrivateAccess_(payload));
    }

    if (action === "decide_agent_private_access") {
      return jsonOutput_(decideAgentPrivateAccess_(payload));
    }

    if (action === "revoke_agent_private_access") {
      return jsonOutput_(revokeAgentPrivateAccess_(payload));
    }

    if (action === "upload_agent_private_document") {
      return jsonOutput_(uploadAgentPrivateDocument_(payload));
    }

    if (action === "download_agent_private_document") {
      return jsonOutput_(downloadAgentPrivateDocument_(payload));
    }

    if (action === "get_agent_object_workspace") {
      return jsonOutput_(getAgentObjectWorkspace_(payload));
    }

    if (action === "get_user_objects") {
      return jsonOutput_(getUserObjects_(payload));
    }

    if (action === "get_user_requests") {
      return jsonOutput_(getUserRequests_(payload));
    }

    if (action === "get_user_requests_verified") {
      return jsonOutput_(getUserRequestsVerified_(payload));
    }

    if (action === "update_user_request") {
      return jsonOutput_(updateUserRequest_(payload));
    }

    if (action === "update_agent_object") {
      return jsonOutput_(updateAgentObject_(payload));
    }

    if (action === "delete_user_object") {
      return jsonOutput_(deleteUserObject_(payload));
    }

    if (action === "save_agent_note") {
      return jsonOutput_(saveAgentNote_(payload));
    }

    if (action === "add_agent_comment") {
      return jsonOutput_(addAgentComment_(payload));
    }

    if (action === "update_agent_comment") {
      return jsonOutput_(updateAgentComment_(payload));
    }

    if (action === "delete_agent_comment") {
      return jsonOutput_(deleteAgentComment_(payload));
    }

    if (action === "report_comment") {
      return jsonOutput_(reportComment_(payload));
    }

    if (action === "claim_agent_client") {
      return jsonOutput_(claimAgentClient_(payload));
    }

    if (action === "release_agent_client") {
      return jsonOutput_(releaseAgentClient_(payload));
    }

    if (action === "get_public_object_agent") {
      return jsonOutput_(getPublicObjectAgent_(payload));
    }

    if (action === "get_public_agent_objects") {
      return jsonOutput_(getPublicAgentObjects_(payload));
    }

    if (!action || action === "append") {
      return jsonOutput_(appendObject_(payload.row || payload));
    }

    return jsonOutput_({ ok: false, error: "unknown_action" });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonOutput_({ ok: false, error: "server_error" });
  }
}

function appendObject_(row) {
  const objectId = normalizeObjectId_(row && row.id);
  if (!objectId) return { ok: false, error: "object_id_required" };
  const existing = findCatalogRecord_(objectId);
  if (existing && cleanText_(existing.row.contact_privacy_mode) !== "agent_private_v1") {
    upsertObjectAgentLink_(row);
    upsertObjectFields_(row, PUBLIC_OBJECT_HEADERS);
    return { ok: true };
  }
  upsertObjectAgentLink_(row);
  const safeRow = Object.assign({}, row);
  const deal = cleanText_(safeRow.deal).toLowerCase();
  if (deal === "аренда" || deal === "продажа") {
    const agentId = agentPrivateOwnerId_(objectId);
    const agent = agentId ? agentRecordById_(agentId) : null;
    if (!agentId) {
      upsertObjectFields_(safeRow, PUBLIC_OBJECT_HEADERS);
      return { ok: true };
    }
    safeRow.contact_privacy_mode = "agent_private_v1";
    if (agentId) saveAgentPrivateListingSnapshot_(objectId, agentId, {
      owner_contact_name: safeRow.contact_name || safeRow.owner_name,
      owner_contact_phone: safeRow.public_contact_phone || safeRow.phone,
      owner_contact_whatsapp: privateWhatsappPhone_(safeRow.whatsapp || safeRow.tg_link),
      legal_status: safeRow.documents,
    });
    const agentPhone = agent && agent.role === "approved" && isValidWorkPhone_(agent.phone) ? cleanText_(agent.phone) : "";
    safeRow.phone = "";
    safeRow.public_contact_phone = agentPhone;
    safeRow.listing_agent_phone = agentPhone;
    safeRow.contact_name = "";
    safeRow.owner_name = "";
    safeRow.owner_contact_phone = "";
    safeRow.owner_contact_whatsapp = "";
    safeRow.documents = "";
    safeRow.tg_link = "";
  }
  upsertObjectFields_(safeRow, PUBLIC_OBJECT_HEADERS);
  return { ok: true };
}

/**
 * One-time repair for requests created before contact_name was introduced.
 * Run this function manually in Apps Script after deploying this version.
 */
function backfillRequestContactNames() {
  const objectsSheet = getRequestsSheet_();
  const objectHeaderMap = ensureHeaders_(objectsSheet, OBJECT_HEADERS);
  const objectRows = sheetRowsAsObjects_(objectsSheet, OBJECT_HEADERS);

  let updated = 0;
  let unresolved = 0;
  objectRows.forEach((record) => {
    if (cleanText_(record.deal).toLowerCase() !== "запрос" || cleanText_(record.contact_name)) return;
    const descriptionMatch = cleanText_(record.description).match(/(?:^|\n)\s*Имя\s*:\s*([^\n]+)/i);
    const name = cleanText_(descriptionMatch && descriptionMatch[1]);
    if (!name) {
      unresolved += 1;
      return;
    }
    objectsSheet.getRange(record._row, objectHeaderMap.contact_name).setValue(safeSheetValue_(name));
    updated += 1;
  });

  SpreadsheetApp.flush();
  const result = { ok: true, updated: updated, unresolved: unresolved };
  console.log(JSON.stringify(result));
  return result;
}

/**
 * Repairs request dates only when an older row already has a trustworthy
 * timestamp in updated_at or actuality_at. Unknown dates stay empty.
 */
function backfillRequestCreatedAt() {
  const objectsSheet = getRequestsSheet_();
  const objectHeaderMap = ensureHeaders_(objectsSheet, OBJECT_HEADERS);
  const objectRows = sheetRowsAsObjects_(objectsSheet, OBJECT_HEADERS);

  let updated = 0;
  let unresolved = 0;
  objectRows.forEach((record) => {
    if (cleanText_(record.deal).toLowerCase() !== "запрос" || cleanText_(record.created_at)) return;
    const fallback = record.updated_at || record.actuality_at;
    const parsed = fallback instanceof Date ? fallback : new Date(cleanText_(fallback));
    if (!fallback || Number.isNaN(parsed.getTime())) {
      unresolved += 1;
      return;
    }
    objectsSheet.getRange(record._row, objectHeaderMap.created_at).setValue(parsed.toISOString());
    updated += 1;
  });

  SpreadsheetApp.flush();
  const result = { ok: true, updated: updated, unresolved: unresolved };
  console.log(JSON.stringify(result));
  return result;
}

function requestSheetId_(value) {
  const requestId = cleanText_(value);
  if (!requestId) return "";
  if (/^(?:request-|web-)/i.test(requestId)) return requestId;
  return "request-" + requestId;
}

function migrateLegacyRequestIds() {
  const objectsSheet = getRequestsSheet_();
  const objectHeaders = ensureHeaders_(objectsSheet, OBJECT_HEADERS);
  const records = sheetRowsAsObjects_(objectsSheet, OBJECT_HEADERS);
  const existingIds = {};
  records.forEach((record) => { existingIds[cleanText_(record.id)] = true; });

  const migratedIds = {};
  const duplicateRows = [];
  let migrated = 0;
  records.forEach((record) => {
    const legacyId = cleanText_(record.id);
    if (cleanText_(record.deal).toLowerCase() !== "запрос" || !/^\d+$/.test(legacyId)) return;
    const targetId = requestSheetId_(legacyId);
    migratedIds[legacyId] = targetId;
    if (existingIds[targetId]) {
      duplicateRows.push(record._row);
      return;
    }
    objectsSheet.getRange(record._row, objectHeaders.id).setValue(safeSheetValue_(targetId));
    existingIds[targetId] = true;
    migrated += 1;
  });
  duplicateRows.sort((left, right) => right - left).forEach((rowNumber) => {
    objectsSheet.deleteRow(rowNumber);
  });

  const linksSheet = getObjectAgentLinksSheet_();
  const linkHeaders = ensureHeaders_(linksSheet, ["object_id", "listing_agent_id", "poster_type"]);
  let linksUpdated = 0;
  if (linksSheet.getLastRow() >= 2) {
    const linkValues = linksSheet.getRange(2, 1, linksSheet.getLastRow() - 1, linksSheet.getLastColumn()).getValues();
    linkValues.forEach((row) => {
      const legacyId = cleanText_(row[linkHeaders.object_id - 1]);
      if (!migratedIds[legacyId]) return;
      row[linkHeaders.object_id - 1] = safeSheetValue_(migratedIds[legacyId]);
      linksUpdated += 1;
    });
    linksSheet.getRange(2, 1, linkValues.length, linkValues[0].length).setValues(linkValues);
  }

  SpreadsheetApp.flush();
  const result = {
    ok: true,
    migrated: migrated,
    duplicate_rows_removed: duplicateRows.length,
    links_updated: linksUpdated,
  };
  console.log(JSON.stringify(result));
  return result;
}

function upsertObjectFields_(values, allowedHeaders, knownRecord) {
  const objectId = cleanText_(values && values.id);
  if (!objectId) {
    throw new Error("object_id_required");
  }
  const existing = knownRecord
    ? {
        row: knownRecord,
        kind: cleanText_(knownRecord.deal).toLowerCase() === "запрос" ? "request" : "object",
      }
    : findCatalogRecord_(objectId);
  const isRequest = cleanText_(values && values.deal).toLowerCase() === "запрос"
    || (existing && existing.kind === "request")
    || /^(?:request-|web-)/i.test(objectId);
  const sheet = isRequest ? getRequestsSheet_() : getObjectsSheet_();
  const rowNumber = upsertFieldsInSheet_(sheet, values, allowedHeaders);
  mirrorLegacyCombinedFields_(values, allowedHeaders);
  syncPublicCatalogSnapshotToD1_();
  return rowNumber;
}

function upsertFieldsInSheet_(sheet, values, allowedHeaders) {
  const headerMap = ensureHeaders_(sheet, OBJECT_HEADERS);
  const objectId = cleanText_(values && values.id);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rowNumber = findValueRow_(sheet, headerMap.id, objectId) || Math.max(sheet.getLastRow() + 1, 2);
    const rowValues = rowNumber <= sheet.getLastRow()
      ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0]
      : new Array(sheet.getLastColumn()).fill("");
    rowValues[headerMap.id - 1] = safeSheetValue_(objectId);
    allowedHeaders.forEach((header) => {
      if (
        header !== "id"
        && headerMap[header]
        && Object.prototype.hasOwnProperty.call(values, header)
      ) {
        rowValues[headerMap[header] - 1] = safeSheetValue_(values[header]);
      }
    });
    sheet.getRange(rowNumber, 1, 1, rowValues.length).setValues([rowValues]);
    return rowNumber;
  } finally {
    lock.releaseLock();
  }
}

function mirrorLegacyCombinedFields_(values, allowedHeaders) {
  const legacy = getLegacyCombinedSheet_();
  if (!legacy) return;
  upsertFieldsInSheet_(legacy, values, allowedHeaders);
}

function saveObjectContract_(payload) {
  const objectId = cleanText_(payload.object_id);
  const timestamp = Number(payload.timestamp);
  const fileSha256 = cleanText_(payload.file_sha256).toLowerCase();
  const canonical = "save_object_contract\n" + objectId + "\n" + timestamp + "\n" + fileSha256;
  if (!serverActionValid_(payload, canonical)) {
    return { ok: false, error: "unauthorized_server_action" };
  }

  const contractNumber = cleanText_(payload.contract_number);
  const contractDate = cleanText_(payload.contract_date);
  const contractUntil = cleanText_(payload.contract_until);
  if (!objectId || !contractNumber || !validIsoDate_(contractDate) || !isTrue_(payload.contract_confirmed)) {
    return { ok: false, error: "contract_fields_required" };
  }
  if (contractUntil && (!validIsoDate_(contractUntil) || contractUntil < contractDate)) {
    return { ok: false, error: "invalid_contract_until" };
  }

  const mimeType = cleanText_(payload.file_type).toLowerCase();
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
  };
  if (!extensions[mimeType]) {
    return { ok: false, error: "unsupported_contract_file_type" };
  }

  let bytes;
  try {
    bytes = Utilities.base64Decode(cleanText_(payload.file_base64));
  } catch (error) {
    return { ok: false, error: "invalid_contract_file" };
  }
  if (!bytes.length || bytes.length > MAX_OWNER_CONTRACT_BYTES) {
    return { ok: false, error: "contract_file_size_invalid" };
  }

  const actualSha256 = bytesToHex_(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
  );
  if (!constantTimeEqual_(actualSha256, fileSha256)) {
    return { ok: false, error: "contract_file_hash_mismatch" };
  }

  const dateToken = contractDate.replace(/-/g, "");
  const fileName = "object_" + sanitizeFileName_(objectId) + "_" + dateToken + "." + extensions[mimeType];
  const file = getOwnerContractsFolder_().createFile(
    Utilities.newBlob(bytes, mimeType, fileName)
  );
  try {
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  } catch (error) {
    console.warn("Could not explicitly reset contract file sharing: " + error);
  }

  upsertObjectFields_(
    {
      id: objectId,
      contract_number: contractNumber,
      contract_date: contractDate,
      contract_until: contractUntil,
      contract_file_id: file.getId(),
      contract_signed: false,
    },
    PRIVATE_CONTRACT_HEADERS
  );
  return { ok: true, admin_url: file.getUrl() };
}

function setObjectContractStatus_(payload) {
  const objectId = cleanText_(payload.object_id);
  const timestamp = Number(payload.timestamp);
  const signed = isTrue_(payload.contract_signed);
  const signedText = signed ? "true" : "false";
  const canonical = "set_object_contract_status\n" + objectId + "\n" + timestamp + "\n" + signedText;
  if (!serverActionValid_(payload, canonical)) {
    return { ok: false, error: "unauthorized_server_action" };
  }
  if (!objectId) {
    return { ok: false, error: "object_id_required" };
  }

  const found = findCatalogRecord_(objectId);
  if (!found || found.kind !== "object") {
    return { ok: false, error: "object_not_found" };
  }
  if (signed && !cleanText_(found.row.contract_file_id)) {
    return { ok: false, error: "contract_file_missing" };
  }
  upsertObjectFields_({ id: objectId, contract_signed: signed }, ["id", "contract_signed"]);
  return { ok: true, contract_signed: signed };
}

function setRequestCreatedAt_(payload) {
  const requestId = cleanText_(payload.request_id);
  const storedRequestId = requestSheetId_(requestId);
  const createdAt = cleanText_(payload.created_at);
  const timestamp = Number(payload.timestamp);
  const canonical = "set_request_created_at\n" + requestId + "\n" + timestamp + "\n" + createdAt;

  if (!serverActionValid_(payload, canonical)) {
    return { ok: false, error: "unauthorized_server_action" };
  }

  const parsed = new Date(createdAt);
  if (!requestId || !createdAt || Number.isNaN(parsed.getTime())) {
    return { ok: false, error: "invalid_request_date" };
  }

  const sheet = getRequestsSheet_();
  const headerMap = ensureHeaders_(sheet, OBJECT_HEADERS);
  const rows = sheetRowsAsObjects_(sheet, OBJECT_HEADERS);
  const matches = rows.filter((record) => (
    cleanText_(record.id) === storedRequestId
    && cleanText_(record.deal).toLowerCase() === "запрос"
  ));

  if (matches.length === 0) {
    return { ok: false, error: "request_not_found" };
  }
  if (matches.length > 1) {
    return { ok: false, error: "duplicate_request_id" };
  }

  const record = matches[0];
  const existing = cleanText_(record.created_at);
  if (existing) {
    return { ok: true, request_id: storedRequestId, created_at: existing, unchanged: true };
  }

  sheet.getRange(record._row, headerMap.created_at).setValue(parsed.toISOString());
  SpreadsheetApp.flush();
  syncPublicCatalogSnapshotToD1_();
  return { ok: true, request_id: storedRequestId, created_at: parsed.toISOString(), updated: true };
}

function serverActionValid_(payload, canonical) {
  const properties = PropertiesService.getScriptProperties();
  const botToken = cleanText_(properties.getProperty("BOT_TOKEN"));
  const signature = cleanText_(payload.signature).toLowerCase();
  const timestamp = Number(payload.timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (
    !botToken
    || !signature
    || !Number.isFinite(timestamp)
    || Math.abs(now - timestamp) > SERVER_ACTION_MAX_AGE_SECONDS
  ) {
    return false;
  }
  const expected = bytesToHex_(
    Utilities.computeHmacSha256Signature(
      canonical,
      botToken,
      Utilities.Charset.UTF_8
    )
  );
  return constantTimeEqual_(expected, signature);
}

function listApprovedAgentsForBot_(payload) {
  const timestamp = Number(payload.timestamp);
  const canonical = "list_approved_agents\n" + timestamp;
  if (!serverActionValid_(payload, canonical)) {
    return { ok: false, error: "unauthorized_server_action" };
  }
  const agents = sheetRowsAsObjects_(getAgentsSheet_(), AGENT_HEADERS)
    .filter((row) => roleFromStatus_(row["Статус"]) === "approved")
    .map((row) => ({
      telegram_id: cleanText_(row.telegram_id),
      name: cleanText_(row["Имя"]) || "Агент Liberterra",
      username: cleanText_(row.Username),
    }))
    .filter((agent) => /^\d+$/.test(agent.telegram_id));
  return { ok: true, agents: agents };
}

// Separate records: user submissions never set verified status. No public IDs.
function agentRegistryRecords_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AgentRegistry");
  const result = {};
  if (!sheet || sheet.getLastRow() < 2) return result;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues().forEach((row) => {
    try { result[row[0]] = JSON.parse(row[1]); } catch (_) {}
  });
  return result;
}
function publicAgentRegistry_(record) {
  if (!record || record.status !== "verified" || !record.checked_at || !record.checked_by) return null;
  const age = Date.now() - Date.parse(record.checked_at);
  if (!Number.isFinite(age) || age < 0 || age > 90 * 86400000) return null;
  return { status: "verified", certificate: record.certificate, full_name: record.full_name,
    source: record.source, checked_at: record.checked_at };
}
function agentRegistryAction_(payload, write) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const target = cleanText_(payload.agent_id || context.telegramId);
  if (!/^\d+$/.test(target) || (target !== context.telegramId && !context.isAdmin)) return {ok:false,error:"forbidden"};
  const agent = sheetRowsAsObjects_(getAgentsSheet_(), AGENT_HEADERS).find((r) => cleanText_(r.telegram_id) === target);
  if (!agent) {
    if (!write && context.isAdmin && target === context.telegramId) return {ok:true,registry:null,is_admin:true};
    return {ok:false,error:"agent_not_found"};
  }
  if (!write) return {ok:true, registry:agentRegistryRecords_()[target] || null, is_admin:context.isAdmin};
  const status = cleanText_(payload.status);
  if (!["pending", "verified", "rejected"].includes(status) || (status !== "pending" && !context.isAdmin)) return {ok:false,error:"forbidden"};
  const fullName = cleanText_(payload.full_name), certificate = cleanText_(payload.certificate);
  const source = cleanText_(payload.source);
  if (fullName.length < 5 || fullName.length > 160 || !/^[A-Za-zА-Яа-я0-9-]{3,40}$/.test(certificate)
      || !/^https:\/\/www\.cci\.kg\/reestry\/[A-Za-z0-9_./%?=&-]+$/.test(source)) return {ok:false,error:"invalid_registry_fields"};
  if (status === "verified" && payload.checked_valid !== true) return {ok:false,error:"confirmation_required"};
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:"busy_retry"};
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = book.getSheetByName("AgentRegistry");
    if (!sheet) { sheet = book.insertSheet("AgentRegistry"); sheet.appendRow(["agent_id", "record"]); }
    const rows = sheet.getDataRange().getDisplayValues();
    const index = rows.findIndex((r, i) => i > 0 && r[0] === target);
    const record = { full_name:fullName, certificate:certificate, source:source, status:status,
      updated_at:new Date().toISOString(), updated_by:context.telegramId,
      checked_at:status === "verified" ? new Date().toISOString() : "",
      checked_by:status === "verified" ? context.telegramId : "" };
    // Audit is persisted before replacing the current record.
    let audit = book.getSheetByName("AgentRegistryAudit");
    if (!audit) { audit = book.insertSheet("AgentRegistryAudit"); audit.appendRow(["agent_id","previous","next"]); }
    audit.appendRow([target, index >= 0 ? rows[index][1] : "", JSON.stringify(record)]);
    sheet.getRange(index >= 0 ? index + 1 : sheet.getLastRow() + 1, 1, 1, 2).setValues([[target, JSON.stringify(record)]]);
    SpreadsheetApp.flush();
    return {ok:true,registry:record,is_admin:context.isAdmin};
  } finally { lock.releaseLock(); }
}

function listPublicAgents_() {
  const registry = agentRegistryRecords_();
  const publicRefToken = cleanText_(PropertiesService.getScriptProperties().getProperty("BOT_TOKEN"));
  const objectRecords = objectRows_(catalogRows_(true));
  const publicObjectIds = {};
  objectRecords.forEach((record) => {
    if (
      isPublicCrmObject_(record)
      && cleanText_(record.deal).toLowerCase() !== "запрос"
    ) {
      publicObjectIds[normalizeObjectId_(record.id)] = true;
    }
  });

  const activeCounts = {};
  objectAgentLinks_(true).forEach((link) => {
    const agentId = cleanText_(link.listing_agent_id);
    const objectId = normalizeObjectId_(link.object_id);
    if (!agentId || !publicObjectIds[objectId]) return;
    activeCounts[agentId] = (activeCounts[agentId] || 0) + 1;
  });

  const agents = readPublicSheetRows_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AGENTS_SHEET_NAME), AGENT_HEADERS)
    .filter((row) => roleFromStatus_(row["Статус"]) === "approved")
    .map((row) => {
      const agentId = cleanText_(row.telegram_id);
      return {
        public_ref: publicAgentRef_(agentId, publicRefToken),
        registry: publicAgentRegistry_(registry[agentId]),
        name: cleanText_(row["Имя"]) || "Агент Liberterra",
        avatar_url: agentAvatarUrl_(row["Публичное фото ID"]),
        agency: cleanText_(row["Агентство"]),
        specialization: normalizeAgentSpecialization_(row["Направление"]),
        experience: cleanText_(row["Опыт"]),
        rating: normalizeAgentRating_(row["Рейтинг"]),
        username: cleanText_(row.Username).replace(/^@/, ""),
        active_object_count: Number(activeCounts[agentId] || 0),
      };
    })
    .filter((agent) => /^[a-f0-9]{24}$/i.test(agent.public_ref))
    .sort((left, right) => (
      right.active_object_count - left.active_object_count
      || left.name.localeCompare(right.name)
    ));

  return { ok: true, agents: agents };
}

function listRegisteredUsersForBot_(payload) {
  const timestamp = Number(payload.timestamp);
  const canonical = "list_registered_users\n" + timestamp;
  if (!serverActionValid_(payload, canonical)) {
    return { ok: false, error: "unauthorized_server_action" };
  }
  const users = sheetRowsAsObjects_(getUsersSheet_(), USER_HEADERS)
    .filter((row) => cleanText_(row["Статус"]).toLowerCase() === "активен")
    .map((row) => ({
      telegram_id: cleanText_(row.telegram_id),
      name: cleanText_(row["Имя"]) || "Пользователь Liberterra",
      phone: cleanText_(row["Телефон"]),
      username: cleanText_(row.Username),
      account_type: cleanText_(row["Тип"]) || "Пользователь",
      registered_at: sheetDateToIso_(row["Дата регистрации"]),
      first_seen_at: sheetDateToIso_(row["Первый вход"]),
      last_seen_at: sheetDateToIso_(row["Последний вход"]),
      visits: Number(row["Посещений"] || 0),
      last_page: cleanText_(row["Последняя страница"]),
      source: cleanText_(row["Источник"]),
      notifications_enabled: cleanText_(row["Уведомления"]).toLowerCase() !== "нет",
    }))
    .filter((user) => /^\d+$/.test(user.telegram_id));
  return { ok: true, users: users };
}

function dashboardDate_(value) {
  const text = cleanText_(value);
  if (!text) return null;
  const local = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (local) {
    const parsedLocal = new Date(
      Number(local[3]), Number(local[2]) - 1, Number(local[1]),
      Number(local[4] || 0), Number(local[5] || 0), Number(local[6] || 0)
    );
    return isNaN(parsedLocal.getTime()) ? null : parsedLocal;
  }
  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function dashboardDayKey_(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  const timezone = Session.getScriptTimeZone() || "Asia/Bishkek";
  return Utilities.formatDate(date, timezone, "yyyy-MM-dd");
}

function getAdminDashboardForBot_(payload) {
  const timestamp = Number(payload.timestamp);
  const canonical = "get_admin_dashboard\n" + timestamp;
  if (!serverActionValid_(payload, canonical)) {
    return { ok: false, error: "unauthorized_server_action" };
  }

  return buildAdminDashboardData_();
}

function buildAdminDashboardData_() {

  const now = new Date();
  const todayKey = dashboardDayKey_(now);
  const dayKeys = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    dayKeys.push(dashboardDayKey_(new Date(now.getTime() - offset * 24 * 60 * 60 * 1000)));
  }
  const daySet = {};
  dayKeys.forEach((key) => { daySet[key] = true; });

  const users = sheetRowsAsObjects_(getUsersSheet_(), USER_HEADERS)
    .filter((row) => cleanText_(row["Статус"]).toLowerCase() === "активен");
  const agents = sheetRowsAsObjects_(getAgentsSheet_(), AGENT_HEADERS);
  const objects = catalogRows_();
  const visits = sheetRowsAsObjects_(getVisitsSheet_(), VISIT_HEADERS);

  const registrationsByDay = {};
  dayKeys.forEach((key) => { registrationsByDay[key] = 0; });
  users.forEach((row) => {
    const key = dashboardDayKey_(dashboardDate_(row["Дата регистрации"]));
    if (daySet[key]) registrationsByDay[key] += 1;
  });

  const sessionsByDay = {};
  const pages = {};
  dayKeys.forEach((key) => { sessionsByDay[key] = {}; });
  visits.forEach((row, index) => {
    const eventName = cleanText_(row["Событие"]).toLowerCase();
    if (eventName && eventName !== "page_view") return;
    const key = dashboardDayKey_(dashboardDate_(row["Дата"]));
    if (!daySet[key]) return;
    const session = cleanText_(row["Сессия"])
      || cleanText_(row["Посетитель"])
      || ("visit-" + index);
    sessionsByDay[key][session] = true;
    const page = cleanText_(row["Страница"]) || cleanText_(row["Путь"]) || "Неизвестная страница";
    pages[page] = (pages[page] || 0) + 1;
  });

  const daily = dayKeys.map((key) => ({
    date: key,
    visits: Object.keys(sessionsByDay[key]).length,
    registrations: registrationsByDay[key],
  }));
  const visits7d = daily.reduce((sum, row) => sum + row.visits, 0);
  const registrations7d = daily.reduce((sum, row) => sum + row.registrations, 0);

  let activeListings = 0;
  let moderationListings = 0;
  let activeRequests = 0;
  objects.forEach((record) => {
    const isRequest = cleanText_(record.deal).toLowerCase() === "запрос";
    const status = normalizedObjectStatus_(record.status);
    if (isRequest && status === "active") activeRequests += 1;
    if (!isRequest && status === "active") activeListings += 1;
    if (!isRequest && status === "moderation") moderationListings += 1;
  });

  const recentUsers = users
    .map((row) => ({
      name: cleanText_(row["Имя"]) || "Пользователь Liberterra",
      account_type: cleanText_(row["Тип"]) || "Пользователь",
      username: cleanText_(row.Username).replace(/^@/, ""),
      registered_at: sheetDateToIso_(row["Дата регистрации"]),
      last_seen_at: sheetDateToIso_(row["Последний вход"]),
      visits: Number(row["Посещений"] || 0),
    }))
    .sort((left, right) => (
      (dashboardDate_(right.registered_at) || new Date(0)).getTime()
      - (dashboardDate_(left.registered_at) || new Date(0)).getTime()
    ))
    .slice(0, 10);

  const topPages = Object.keys(pages)
    .map((page) => ({ page: page, visits: pages[page] }))
    .sort((left, right) => right.visits - left.visits)
    .slice(0, 6);

  return {
    ok: true,
    generated_at: now.toISOString(),
    metrics: {
      registered_users: users.length,
      registrations_today: Number(registrationsByDay[todayKey] || 0),
      registrations_7d: registrations7d,
      visits_today: Number((daily.find((row) => row.date === todayKey) || {}).visits || 0),
      visits_7d: visits7d,
      approved_agents: agents.filter((row) => roleFromStatus_(row["Статус"]) === "approved").length,
      pending_agents: agents.filter((row) => roleFromStatus_(row["Статус"]) === "pending").length,
      active_listings: activeListings,
      moderation_listings: moderationListings,
      active_requests: activeRequests,
    },
    daily: daily,
    top_pages: topPages,
    recent_users: recentUsers,
  };
}

function sheetDateToIso_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString();
  const text = cleanText_(value);
  if (!text) return "";
  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? text : parsed.toISOString();
}

function validIsoDate_(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(cleanText_(value));
}

function isTrue_(value) {
  if (value === true) return true;
  return ["true", "1", "yes", "да"].indexOf(cleanText_(value).toLowerCase()) !== -1;
}

function trackPageView_(payload) {
  return trackAnalyticsEvent_(payload);
}

function trackAnalyticsEvent_(payload) {
  const event = normalizeAnalyticsEvent_(payload);
  if (!event) {
    return { ok: false, error: "invalid_analytics_event" };
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = "analytics:" + event.eventId;
  if (cache.get(cacheKey)) {
    return { ok: true, duplicate: true };
  }
  cache.put(cacheKey, "1", 600);

  const identity = resolveAnalyticsIdentity_(event);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getVisitsSheet_();
    const headerMap = ensureHeaders_(sheet, VISIT_HEADERS);
    const row = new Array(sheet.getLastColumn()).fill("");
    const values = {
      "Дата": new Date(),
      "Событие": event.eventType,
      "Посетитель": event.visitorId,
      "Сессия": event.sessionId,
      "Страница": event.page,
      "Путь": event.path,
      "Источник": event.source,
      "Переход с": event.referrer,
      "Устройство": event.device,
      "Telegram ID": identity.telegramId,
      "Имя": identity.name,
      "Телефон": identity.phone,
      "Username": identity.username,
      "Объект": event.objectId,
      "Действие": event.actionName,
      "Кнопка": event.buttonLabel,
      "Цель": event.target,
    };
    Object.keys(values).forEach((header) => {
      if (headerMap[header]) {
        row[headerMap[header] - 1] = safeSheetValue_(values[header]);
      }
    });
    sheet.appendRow(row);
    touchTrackedUser_(identity, event);
  } finally {
    lock.releaseLock();
  }

  return { ok: true };
}

function normalizePageView_(payload) {
  return normalizeAnalyticsEvent_(Object.assign({}, payload, {
    event_type: payload.event_type || "page_view",
  }));
}

function normalizeAnalyticsEvent_(payload) {
  const eventId = cleanAnalyticsId_(payload.event_id, 100);
  const visitorId = cleanAnalyticsId_(payload.visitor_id, 100);
  if (!eventId || !visitorId) {
    return null;
  }

  const allowedPages = ["catalog", "object", "map", "requests", "profile", "listings", "other"];
  const page = cleanAnalyticsText_(payload.page, 40).toLowerCase();
  const normalizedPage = allowedPages.indexOf(page) === -1 ? "other" : page;
  const allowedDevices = ["mobile", "tablet", "desktop"];
  const device = cleanAnalyticsText_(payload.device, 20).toLowerCase();
  const eventType = cleanAnalyticsId_(payload.event_type || "page_view", 30).toLowerCase();
  if (["page_view", "click", "registration"].indexOf(eventType) === -1) {
    return null;
  }
  const telegramId = cleanAnalyticsId_(payload.telegram_id, 30);

  return {
    eventId: eventId,
    eventType: eventType,
    visitorId: visitorId,
    sessionId: cleanAnalyticsId_(payload.session_id, 100),
    page: normalizedPage,
    path: cleanAnalyticsText_(payload.path, 180),
    source: cleanAnalyticsText_(payload.source, 80) || "direct",
    referrer: cleanAnalyticsText_(payload.referrer, 120),
    device: allowedDevices.indexOf(device) === -1 ? "desktop" : device,
    telegramId: /^\d{5,20}$/.test(telegramId) ? telegramId : "",
    initData: cleanText_(payload.init_data || payload.initData).slice(0, 4096),
    objectId: cleanAnalyticsText_(payload.object_id, 80),
    actionName: cleanAnalyticsId_(payload.action_name, 50).toLowerCase(),
    buttonLabel: cleanAnalyticsText_(payload.button_label, 120),
    target: cleanAnalyticsText_(payload.target, 180),
  };
}

function resolveAnalyticsIdentity_(event) {
  const empty = { telegramId: "", name: "", phone: "", username: "" };
  if (!event.telegramId || !event.initData) {
    return empty;
  }

  const auth = validateTelegramInitData_(event.initData, event.telegramId);
  if (!auth.ok) {
    return empty;
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = "analytics-identity:" + auth.telegramId;
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (_error) {
      // Refresh a malformed cache entry from Telegram and the user sheets.
    }
  }

  const user = auth.user || {};
  const identity = {
    telegramId: auth.telegramId,
    name: [cleanText_(user.first_name), cleanText_(user.last_name)].filter(Boolean).join(" "),
    phone: "",
    username: cleanText_(user.username),
  };

  const usersSheet = getUsersSheet_();
  const userHeaders = ensureHeaders_(usersSheet, USER_HEADERS);
  const userRow = findValueRow_(usersSheet, userHeaders.telegram_id, auth.telegramId);
  if (userRow) {
    const values = usersSheet.getRange(userRow, 1, 1, usersSheet.getLastColumn()).getDisplayValues()[0];
    identity.name = cleanText_(values[userHeaders["Имя"] - 1]) || identity.name;
    identity.phone = cleanText_(values[userHeaders["Телефон"] - 1]);
    identity.username = cleanText_(values[userHeaders["Username"] - 1]) || identity.username;
  } else {
    const agentsSheet = getAgentsSheet_();
    const agentHeaders = ensureHeaders_(agentsSheet, AGENT_HEADERS);
    const agentRow = findAgentRow_(agentsSheet, agentHeaders.telegram_id, auth.telegramId);
    if (agentRow) {
      const values = agentsSheet.getRange(agentRow, 1, 1, agentsSheet.getLastColumn()).getDisplayValues()[0];
      identity.name = cleanText_(values[agentHeaders["Имя"] - 1]) || identity.name;
      identity.phone = cleanText_(values[agentHeaders["Телефон"] - 1]);
      identity.username = cleanText_(values[agentHeaders["Username"] - 1]) || identity.username;
    }
  }

  cache.put(cacheKey, JSON.stringify(identity), 300);
  return identity;
}

function touchTrackedUser_(identity, event) {
  if (!identity.telegramId) return;
  const sheet = getUsersSheet_();
  const headerMap = ensureHeaders_(sheet, USER_HEADERS);
  const existingRow = findValueRow_(sheet, headerMap.telegram_id, identity.telegramId);
  const rowNumber = existingRow || Math.max(sheet.getLastRow() + 1, 2);
  const now = new Date();
  const current = existingRow
    ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0]
    : new Array(sheet.getLastColumn()).fill("");
  const read = (header) => headerMap[header] ? current[headerMap[header] - 1] : "";
  const write = (header, value) => {
    if (headerMap[header]) current[headerMap[header] - 1] = safeSheetValue_(value);
  };

  write("telegram_id", identity.telegramId);
  if (!read("Имя") && identity.name) write("Имя", identity.name);
  if (!read("Телефон") && identity.phone) write("Телефон", identity.phone);
  if (!read("Username") && identity.username) write("Username", identity.username);
  if (!read("Тип")) write("Тип", "Посетитель");
  if (!read("Статус")) write("Статус", "посетитель");
  if (!read("Первый вход")) write("Первый вход", now);
  write("Последний вход", now);
  write("Обновлено", now);
  write("Последняя страница", event.page);
  write("Источник", event.source);
  if (!read("Уведомления")) write("Уведомления", "да");
  if (event.eventType === "page_view") {
    write("Посещений", Number(read("Посещений") || 0) + 1);
  }
  sheet.getRange(rowNumber, 1, 1, current.length).setValues([current]);
}

function cleanAnalyticsId_(value, maxLength) {
  const cleaned = cleanText_(value).slice(0, maxLength);
  return /^[a-zA-Z0-9._-]+$/.test(cleaned) ? cleaned : "";
}

function cleanAnalyticsText_(value, maxLength) {
  return cleanText_(value).replace(/[\u0000-\u001f\u007f]+/g, " ").slice(0, maxLength);
}

function checkAgent_(payload) {
  const auth = validateTelegramInitData_(payload.init_data || payload.initData, payload.telegram_id);
  if (!auth.ok) {
    return agentAccessResponse_("guest");
  }

  const sheet = getAgentsSheet_();
  const headerMap = ensureHeaders_(sheet, AGENT_HEADERS);
  const rowNumber = findAgentRow_(sheet, headerMap.telegram_id, auth.telegramId);
  if (!rowNumber) {
    return agentAccessResponse_("guest");
  }

  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const status = row[headerMap["Статус"] - 1];
  const specialization = row[headerMap["Направление"] - 1];
  const termsAccepted = row[headerMap["Условия приняты"] - 1];
  const termsAcceptedAt = row[headerMap["Дата согласия"] - 1];
  return agentAccessResponse_(
    roleFromStatus_(status),
    auth.telegramId,
    specialization,
    termsAccepted,
    termsAcceptedAt
  );
}

function setAgentSpecialization_(payload) {
  const auth = validateTelegramInitData_(payload.init_data || payload.initData, payload.telegram_id);
  if (!auth.ok) {
    return { ok: false, role: "guest", error: "invalid_telegram_session" };
  }

  const specialization = normalizeAgentSpecialization_(payload.specialization);
  if (!specialization) {
    return { ok: false, error: "specialization_required" };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let termsAccepted = "";
  let termsAcceptedAt = "";
  try {
    const sheet = getAgentsSheet_();
    const headerMap = ensureHeaders_(sheet, AGENT_HEADERS);
    const rowNumber = findAgentRow_(sheet, headerMap.telegram_id, auth.telegramId);
    if (!rowNumber) {
      return { ok: false, role: "guest", error: "agent_not_found" };
    }

    const status = sheet.getRange(rowNumber, headerMap["Статус"]).getDisplayValue();
    const role = roleFromStatus_(status);
    if (role !== "approved") {
      return { ok: false, role: role, error: "agent_not_approved" };
    }

    sheet
      .getRange(rowNumber, headerMap["Направление"])
      .setValue(agentSpecializationLabel_(specialization));
    termsAccepted = sheet.getRange(rowNumber, headerMap["Условия приняты"]).getDisplayValue();
    termsAcceptedAt = sheet.getRange(rowNumber, headerMap["Дата согласия"]).getDisplayValue();
  } finally {
    lock.releaseLock();
  }

  return agentAccessResponse_(
    "approved",
    auth.telegramId,
    specialization,
    termsAccepted,
    termsAcceptedAt
  );
}

function acceptAgentTerms_(payload) {
  const auth = validateTelegramInitData_(payload.init_data || payload.initData, payload.telegram_id);
  if (!auth.ok) {
    return { ok: false, role: "guest", error: "invalid_telegram_session" };
  }

  const accepted = payload.accepted === true || cleanText_(payload.accepted).toLowerCase() === "true";
  if (!accepted) {
    return { ok: false, error: "terms_consent_required" };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let specialization = "";
  let acceptedAt = new Date();
  try {
    const sheet = getAgentsSheet_();
    const headerMap = ensureHeaders_(sheet, AGENT_HEADERS);
    const rowNumber = findAgentRow_(sheet, headerMap.telegram_id, auth.telegramId);
    if (!rowNumber) {
      return { ok: false, role: "guest", error: "agent_not_found" };
    }

    const status = sheet.getRange(rowNumber, headerMap["Статус"]).getDisplayValue();
    const role = roleFromStatus_(status);
    if (role !== "approved") {
      return { ok: false, role: role, error: "agent_not_approved" };
    }

    specialization = normalizeAgentSpecialization_(
      sheet.getRange(rowNumber, headerMap["Направление"]).getDisplayValue()
    );
    if (!specialization) {
      return { ok: false, role: role, error: "specialization_required" };
    }

    sheet.getRange(rowNumber, headerMap["Условия приняты"]).setValue("Да");
    sheet.getRange(rowNumber, headerMap["Дата согласия"]).setValue(acceptedAt);
  } finally {
    lock.releaseLock();
  }

  return agentAccessResponse_(
    "approved",
    auth.telegramId,
    specialization,
    true,
    acceptedAt.toISOString()
  );
}

function registerAgent_(payload) {
  const auth = validateTelegramInitData_(payload.init_data || payload.initData, payload.telegram_id);
  if (!auth.ok) {
    return { ok: false, role: "guest", error: "invalid_telegram_session" };
  }

  const fullName = cleanText_(payload.full_name);
  const phone = cleanText_(payload.phone);
  const specialization = normalizeAgentSpecialization_(payload.specialization);
  const acceptedRules = payload.rules_accepted === true || cleanText_(payload.rules_accepted).toLowerCase() === "true";
  if (!fullName || !phone || !specialization || !acceptedRules) {
    return { ok: false, error: "required_fields_missing" };
  }
  if (!isValidWorkPhone_(phone)) {
    return { ok: false, error: "invalid_work_phone" };
  }

  const privateAgent = payload.private_agent === true || cleanText_(payload.private_agent).toLowerCase() === "true";
  const agency = privateAgent ? "Частный агент" : cleanText_(payload.agency);
  const username = normalizeUsername_(payload.username || auth.user.username || "");
  const experience = cleanText_(payload.experience);
  let documentValue = cleanText_(payload.document);
  const documentPhotoUrl = saveAgentDocumentPhoto_(payload, auth.telegramId);
  if (documentPhotoUrl) {
    documentValue = documentValue ? documentValue + "\nФото: " + documentPhotoUrl : "Фото: " + documentPhotoUrl;
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  let role = "pending";
  let termsAccepted = "";
  let termsAcceptedAt = "";
  try {
    const sheet = getAgentsSheet_();
    const headerMap = ensureHeaders_(sheet, AGENT_HEADERS);
    let rowNumber = findAgentRow_(sheet, headerMap.telegram_id, auth.telegramId);
    let status = "на проверке";

    if (rowNumber) {
      const currentStatus = sheet.getRange(rowNumber, headerMap["Статус"]).getDisplayValue();
      termsAccepted = sheet.getRange(rowNumber, headerMap["Условия приняты"]).getDisplayValue();
      termsAcceptedAt = sheet.getRange(rowNumber, headerMap["Дата согласия"]).getDisplayValue();
      if (roleFromStatus_(currentStatus) === "approved") {
        status = "одобрен";
        role = "approved";
      }
    } else {
      rowNumber = Math.max(sheet.getLastRow() + 1, 2);
    }

    const rowValues = new Array(sheet.getLastColumn()).fill("");
    rowValues[headerMap.telegram_id - 1] = safeSheetValue_(auth.telegramId);
    rowValues[headerMap["Имя"] - 1] = safeSheetValue_(fullName);
    rowValues[headerMap["Агентство"] - 1] = safeSheetValue_(agency);
    rowValues[headerMap["Направление"] - 1] = safeSheetValue_(agentSpecializationLabel_(specialization));
    rowValues[headerMap["Телефон"] - 1] = safeSheetValue_(phone);
    rowValues[headerMap.Username - 1] = safeSheetValue_(username);
    rowValues[headerMap["Опыт"] - 1] = safeSheetValue_(experience);
    rowValues[headerMap["Документ"] - 1] = safeSheetValue_(documentValue);
    rowValues[headerMap["Статус"] - 1] = status;
    rowValues[headerMap["Дата"] - 1] = new Date();
    rowValues[headerMap["Условия приняты"] - 1] = safeSheetValue_(termsAccepted);
    rowValues[headerMap["Дата согласия"] - 1] = termsAcceptedAt;
    sheet.getRange(rowNumber, 1, 1, rowValues.length).setValues([rowValues]);
  } finally {
    lock.releaseLock();
  }

  const notificationSent = notifyAdminAboutAgent_({
    telegramId: auth.telegramId,
    fullName: fullName,
    agency: agency || "Не указано",
    specialization: agentSpecializationLabel_(specialization),
    phone: phone,
    username: username,
  });

  const response = agentAccessResponse_(
    role,
    auth.telegramId,
    specialization,
    termsAccepted,
    termsAcceptedAt
  );
  response.notification_sent = notificationSent;
  return response;
}

function agentAccessResponse_(role, telegramId, specializationValue, termsAcceptedValue, termsAcceptedAtValue) {
  const normalizedRole = roleFromStatus_(role);
  const response = { ok: true, role: normalizedRole };
  if (normalizedRole !== "approved") {
    return response;
  }

  const specialization = normalizeAgentSpecialization_(specializationValue);
  if (!specialization) {
    response.specialization_required = true;
    return response;
  }
  const agreementUrl = cleanText_(PropertiesService.getScriptProperties().getProperty("AGENT_AGREEMENT_URL"));
  response.agent_access = {
    specialization: specialization,
    commission: agentCommissionForSpecialization_(specialization),
    terms: {
      title: AGENT_TERMS_CONFIG.title,
      intro: AGENT_TERMS_CONFIG.intro,
      sections: agentTermsForSpecialization_(specialization),
      agreement_url: /^https:\/\//i.test(agreementUrl) ? agreementUrl : "",
      accepted: isAgentTermsAccepted_(termsAcceptedValue),
      accepted_at: cleanText_(termsAcceptedAtValue),
    },
    labels: {
      other_agent_note: "Объект другого агента — комиссия делится 50/50",
    },
    other_agent_object_ids: otherAgentObjectIds_(telegramId),
    verified_contract_object_ids: verifiedContractObjectIds_(),
  };
  return response;
}

function upsertObjectAgentLink_(row) {
  const objectId = cleanText_(row && row.id);
  const posterType = cleanText_(row && row.poster_type).toLowerCase();
  const listingAgentId = cleanText_(row && row.listing_agent_id);
  if (!objectId || (!posterType && !listingAgentId)) {
    return;
  }

  const sheet = getObjectAgentLinksSheet_();
  const headers = ["object_id", "listing_agent_id", "poster_type"];
  const headerMap = ensureHeaders_(sheet, headers);
  const rowNumber = findValueRow_(sheet, headerMap.object_id, objectId) || Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([[
    safeSheetValue_(objectId),
    safeSheetValue_(listingAgentId),
    safeSheetValue_(posterType),
  ]]);
}

function upsertObjectAgentLinks_(rows, existingRows) {
  const updates = (rows || []).filter((row) => cleanText_(row && row.id));
  if (!updates.length) return;
  const sheet = getObjectAgentLinksSheet_();
  const headers = ["object_id", "listing_agent_id", "poster_type"];
  ensureHeaders_(sheet, headers);
  const merged = (existingRows || sheetRowsAsObjects_(sheet, headers)).map((row) => [
    cleanText_(row.object_id),
    cleanText_(row.listing_agent_id),
    cleanText_(row.poster_type),
  ]);
  const indexById = {};
  merged.forEach((values, index) => { indexById[normalizeObjectId_(values[0])] = index; });
  updates.forEach((row) => {
    const values = [
      safeSheetValue_(normalizeObjectId_(row.id)),
      safeSheetValue_(row.listing_agent_id),
      safeSheetValue_(cleanText_(row.poster_type).toLowerCase()),
    ];
    const index = indexById[normalizeObjectId_(row.id)];
    if (index === undefined) {
      indexById[normalizeObjectId_(row.id)] = merged.length;
      merged.push(values);
    } else {
      merged[index] = values;
    }
  });
  sheet.getRange(2, 1, merged.length, headers.length).setValues(merged);
}

function otherAgentObjectIds_(telegramId) {
  const currentAgentId = cleanText_(telegramId);
  if (!currentAgentId) {
    return [];
  }

  const sheet = getObjectAgentLinksSheet_();
  const headerMap = ensureHeaders_(sheet, ["object_id", "listing_agent_id", "poster_type"]);
  if (sheet.getLastRow() < 2) {
    return [];
  }

  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues()
    .filter((row) => cleanText_(row[headerMap.poster_type - 1]).toLowerCase() === "агент")
    .filter((row) => {
      const listingAgentId = cleanText_(row[headerMap.listing_agent_id - 1]);
      return listingAgentId && listingAgentId !== currentAgentId;
    })
    .map((row) => cleanText_(row[headerMap.object_id - 1]))
    .filter(Boolean);
}

function verifiedContractObjectIds_() {
  return objectRows_().reduce((objectIds, row) => {
    if (isTrue_(row.contract_signed)) {
      const objectId = cleanText_(row.id);
      if (objectId) objectIds.push(objectId);
    }
    return objectIds;
  }, []);
}

function approvedAgentContext_(payload, authenticatedContext) {
  if (!authenticatedContext && payload.web_user_id) authenticatedContext = registeredUserContext_(payload);
  if (authenticatedContext && authenticatedContext.ok && authenticatedContext.webUserId) {
    const account = passwordAccounts_().find((row) => cleanText_(row.web_user_id) === authenticatedContext.webUserId && row._account_type === "Агент");
    if (!account || !passwordAccountActive_(account,"Агент")) return {ok:false,error:"agent_not_approved"};
    if (!isAgentTermsAccepted_(account["Условия приняты"])) return {ok:false,error:"terms_not_accepted"};
    const specialization = normalizeAgentSpecialization_(account["Направление"]);
    if (!specialization) return {ok:false,error:"specialization_required"};
    return Object.assign({},authenticatedContext,{role:"approved",specialization:specialization});
  }
  const auth = authenticatedContext && authenticatedContext.ok
    ? {
        ok: true,
        telegramId: authenticatedContext.telegramId,
        user: authenticatedContext.user || {},
      }
    : validateTelegramInitData_(payload.init_data || payload.initData, payload.telegram_id);
  if (!auth.ok) {
    return { ok: false, role: "guest", error: "invalid_telegram_session" };
  }

  const sheet = getAgentsSheet_();
  const headerMap = ensureHeaders_(sheet, AGENT_HEADERS);
  const rowNumber = findAgentRow_(sheet, headerMap.telegram_id, auth.telegramId);
  if (!rowNumber) {
    return { ok: false, role: "guest", error: "agent_not_found" };
  }

  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const role = roleFromStatus_(values[headerMap["Статус"] - 1]);
  if (role !== "approved") {
    return { ok: false, role: role, error: "agent_not_approved" };
  }

  const specialization = normalizeAgentSpecialization_(values[headerMap["Направление"] - 1]);
  if (!specialization) {
    return { ok: false, role: role, error: "specialization_required" };
  }
  if (!isAgentTermsAccepted_(values[headerMap["Условия приняты"] - 1])) {
    return { ok: false, role: role, error: "terms_not_accepted" };
  }

  const properties = PropertiesService.getScriptProperties();
  const adminId = cleanText_(
    properties.getProperty("ADMIN_TELEGRAM_ID") || properties.getProperty("ADMIN_CHAT_ID")
  );
  return {
    ok: true,
    role: role,
    telegramId: cleanText_(auth.telegramId),
    user: auth.user || {},
    name: cleanText_(values[headerMap["Имя"] - 1]) || "Агент Liberterra",
    specialization: specialization,
    isAdmin: Boolean(adminId && adminId === cleanText_(auth.telegramId)),
  };
}

function telegramUserContext_(payload) {
  const auth = validateTelegramInitData_(payload.init_data || payload.initData, payload.telegram_id);
  if (!auth.ok) return { ok: false, role: "guest", error: "invalid_telegram_session" };
  const user = auth.user || {};
  const name = [cleanText_(user.first_name), cleanText_(user.last_name)].filter(Boolean).join(" ")
    || (cleanText_(user.username) ? "@" + cleanText_(user.username).replace(/^@+/, "") : "Пользователь Telegram");
  const properties = PropertiesService.getScriptProperties();
  const adminId = cleanText_(properties.getProperty("ADMIN_TELEGRAM_ID") || properties.getProperty("ADMIN_CHAT_ID"));
  return {
    ok: true,
    role: "user",
    telegramId: cleanText_(auth.telegramId),
    name: name.slice(0, 120),
    isAdmin: Boolean(adminId && adminId === cleanText_(auth.telegramId)),
  };
}

function registeredUserContext_(payload) {
  // Website sessions are verified by the Cloudflare Worker.  The Worker sends
  // the private gateway secret plus the web account id; from there we restore
  // the original Telegram identity so listings created before email login keep
  // the same owner.
  if (cleanText_(payload && payload.web_user_id)) {
    if (!emailAuthAuthorized_(payload)) return { ok: false, role: "guest", error: "unauthorized" };
    const webUserId = cleanText_(payload.web_user_id);
    const row = passwordAccounts_().find((item) => cleanText_(item.web_user_id) === webUserId);
    if (!row || !passwordAccountActive_(row, row._account_type) || !authorizedUserRow_(webUserId)) {
      return { ok: false, role: "guest", registered: false, error: "registration_required" };
    }
    const telegramId = cleanText_(row.telegram_id) || "web:" + webUserId;
    const properties = PropertiesService.getScriptProperties();
    const adminId = cleanText_(properties.getProperty("ADMIN_TELEGRAM_ID") || properties.getProperty("ADMIN_CHAT_ID"));
    return {
      ok: true,
      role: row._account_type === "Агент" ? "approved" : "user",
      telegramId: telegramId,
      name: cleanText_(row["Имя"]) || "Пользователь",
      phone: cleanText_(row["Телефон"]),
      accountType: row._account_type || cleanText_(row["Тип"]) || "Пользователь",
      registered: true,
      isAdmin: Boolean(adminId && adminId === telegramId),
      webUserId: webUserId,
    };
  }
  const context = telegramUserContext_(payload);
  if (!context.ok) return context;
  const sheet = getUsersSheet_();
  const headerMap = ensureHeaders_(sheet, USER_HEADERS);
  const rowNumber = findValueRow_(sheet, headerMap.telegram_id, context.telegramId);
  if (rowNumber) {
    const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const status = cleanText_(values[headerMap["Статус"] - 1]).toLowerCase();
    if (status === "заблокирован") {
      return { ok: false, role: "blocked", error: "user_blocked" };
    }
    if (status === "активен") {
      return {
        ...context,
        registered: true,
        name: cleanText_(values[headerMap["Имя"] - 1]) || context.name,
        phone: cleanText_(values[headerMap["Телефон"] - 1]),
        accountType: cleanText_(values[headerMap["Тип"] - 1]) || "Пользователь",
      };
    }
  }
  const agent = agentRecordById_(context.telegramId);
  if (agent) {
    return { ...context, registered: true, name: agent.name || context.name, accountType: "Агент" };
  }
  return { ok: false, role: "guest", registered: false, error: "registration_required" };
}

function registerUser_(payload) {
  const context = cleanText_(payload && payload.web_user_id) ? webRegisteredUserContext_(payload) : telegramUserContext_(payload);
  if (!context.ok) return context;
  const name = cleanText_(payload.full_name || payload.name).slice(0, 120);
  const phone = cleanText_(payload.phone).slice(0, 40);
  const accountType = cleanText_(payload.account_type) === "Агент" ? "Агент" : "Пользователь";
  if (name.length < 2) return { ok: false, error: "name_required" };
  if (!isValidWorkPhone_(phone)) return { ok: false, error: "invalid_phone" };
  const username = cleanText_(context.user && context.user.username).replace(/^@+/, "");
  const sheet = getUsersSheet_();
  const headerMap = ensureHeaders_(sheet, USER_HEADERS);
  const rowNumber = findValueRow_(sheet, headerMap.telegram_id, context.telegramId) || Math.max(sheet.getLastRow() + 1, 2);
  const existingDate = rowNumber <= sheet.getLastRow()
    ? sheet.getRange(rowNumber, headerMap["Дата регистрации"]).getValue()
    : "";
  const now = new Date();
  const current = rowNumber <= sheet.getLastRow()
    ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0]
    : new Array(sheet.getLastColumn()).fill("");
  const write = (header, value) => {
    if (headerMap[header]) current[headerMap[header] - 1] = safeSheetValue_(value);
  };
  write("telegram_id", context.telegramId);
  write("Имя", name);
  write("Телефон", phone);
  write("Username", username ? "@" + username : "");
  write("Тип", accountType);
  write("Статус", "активен");
  write("Дата регистрации", existingDate || now);
  write("Обновлено", now);
  if (!current[headerMap["Первый вход"] - 1]) write("Первый вход", now);
  write("Последний вход", now);
  if (!current[headerMap["Уведомления"] - 1]) write("Уведомления", "да");
  sheet.getRange(rowNumber, 1, 1, current.length).setValues([current]);
  return { ok: true, registered: true, user: { name: name, account_type: accountType } };
}

function checkUser_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  return {
    ok: true,
    registered: true,
    user: { name: context.name, account_type: context.accountType || "Пользователь" },
  };
}

// Email sign-in is intentionally limited to client accounts. Agents retain Telegram
// identity and moderation so a public email address cannot create an agent account.
function emailAuthAuthorized_(payload) {
  const expected = PropertiesService.getScriptProperties().getProperty("EMAIL_AUTH_SHARED_SECRET");
  return Boolean(expected && constantTimeEqual_(expected, cleanText_(payload.auth_secret)));
}

function normalizeEmail_(value) {
  const email = cleanText_(value).toLowerCase().trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 160 ? email : "";
}

function emailAuthKey_(email) {
  return "email-auth:" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email)).replace(/=+$/g, "");
}

function emailCodeHash_(email, code) {
  const secret = PropertiesService.getScriptProperties().getProperty("EMAIL_AUTH_SHARED_SECRET");
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(email + "\n" + code, secret)).replace(/=+$/g, "");
}

function startEmailAuth_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const email = normalizeEmail_(payload.email);
  const name = cleanText_(payload.full_name || payload.name).slice(0, 120);
  const phone = cleanText_(payload.phone).slice(0, 40);
  const accountType = cleanText_(payload.account_type) === "Агент" ? "Агент" : "Пользователь";
  const code = cleanText_(payload.code);
  if (!email || !/^[0-9]{6}$/.test(code)) return { ok: false, error: "invalid_email_auth" };
  if (name && name.length < 2) return { ok: false, error: "name_required" };
  if (phone && !isValidWorkPhone_(phone)) return { ok: false, error: "invalid_phone" };
  const cache = CacheService.getScriptCache();
  const key = emailAuthKey_(email);
  const existing = cache.get(key);
  if (existing) return { ok: false, error: "retry_later" };
  cache.put(key, JSON.stringify({ hash: emailCodeHash_(email, code), attempts: 0, name: name, phone: phone, accountType: accountType }), 10 * 60);
  MailApp.sendEmail({
    to: email,
    subject: "Код входа в Liberterra",
    body: "Ваш код для входа в Liberterra: " + code + "\n\nКод действует 10 минут. Никому его не сообщайте.",
    name: "Liberterra",
  });
  return { ok: true, expires_in: 600 };
}

function verifyEmailAuth_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const email = normalizeEmail_(payload.email);
  const code = cleanText_(payload.code);
  if (!email || !/^[0-9]{6}$/.test(code)) return { ok: false, error: "invalid_code" };
  const cache = CacheService.getScriptCache();
  const key = emailAuthKey_(email);
  const raw = cache.get(key);
  if (!raw) return { ok: false, error: "code_expired" };
  let challenge;
  try { challenge = JSON.parse(raw); } catch (_) { cache.remove(key); return { ok: false, error: "code_expired" }; }
  if (Number(challenge.attempts || 0) >= 5) { cache.remove(key); return { ok: false, error: "too_many_attempts" }; }
  if (!constantTimeEqual_(emailCodeHash_(email, code), cleanText_(challenge.hash))) {
    challenge.attempts = Number(challenge.attempts || 0) + 1;
    cache.put(key, JSON.stringify(challenge), 10 * 60);
    return { ok: false, error: "invalid_code" };
  }
  cache.remove(key);
  const sheet = getUsersSheet_();
  const headers = ensureHeaders_(sheet, USER_HEADERS);
  const rowNumber = findValueRow_(sheet, headers["Email"], email) || Math.max(sheet.getLastRow() + 1, 2);
  const exists = rowNumber <= sheet.getLastRow();
  const current = exists ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0] : new Array(sheet.getLastColumn()).fill("");
  const read = (header) => headers[header] ? current[headers[header] - 1] : "";
  const write = (header, value) => { if (headers[header]) current[headers[header] - 1] = safeSheetValue_(value); };
  const now = new Date();
  const userId = cleanText_(read("web_user_id")) || Utilities.getUuid();
  write("web_user_id", userId);
  write("Email", email);
  write("Email подтверждён", now);
  if (!read("Имя") && challenge.name) write("Имя", challenge.name);
  if (!read("Телефон") && challenge.phone) write("Телефон", challenge.phone);
  const accountType = cleanText_(challenge.accountType) === "Агент" ? "Агент" : "Пользователь";
  if (!read("Тип")) write("Тип", accountType);
  if (!read("Статус")) write("Статус", accountType === "Агент" ? "на модерации" : "активен");
  if (!read("Дата регистрации")) write("Дата регистрации", now);
  if (!read("Первый вход")) write("Первый вход", now);
  write("Последний вход", now);
  write("Обновлено", now);
  if (!read("Уведомления")) write("Уведомления", "да");
  sheet.getRange(rowNumber, 1, 1, current.length).setValues([current]);
  const user = {}; Object.keys(headers).forEach((header) => user[header] = current[headers[header] - 1]);
  authorizeUser_(user);
  return { ok: true, registered: true, user: userForPasswordAuth_(user) };
}

// Password material is already PBKDF2-hashed in the Worker. Never accept or
// store a raw password in Apps Script or the spreadsheet.
function passwordChallengeKey_(kind, email) {
  return "password-" + kind + ":" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email)).replace(/=+$/g, "");
}

function validPasswordRecord_(payload) {
  const salt = cleanText_(payload.password_salt);
  const hash = cleanText_(payload.password_hash);
  const iterations = Number(payload.password_iterations);
  return /^[A-Za-z0-9_-]{16,80}$/.test(salt) && /^[A-Za-z0-9_-]{32,100}$/.test(hash)
    && Number.isInteger(iterations) && iterations >= 100000 && iterations <= 1000000;
}

function userForPasswordAuth_(row) {
  return {
    web_user_id: cleanText_(row.web_user_id),
    email: normalizeEmail_(row.Email),
    name: cleanText_(row["Имя"]) || "Пользователь",
    account_type: cleanText_(row._account_type || row["Тип"]) || "Пользователь",
    status: cleanText_(row["Статус"]) || "активен",
  };
}

// Website credentials may belong to a normal Telegram user or to an approved
// Telegram agent.  Both keep their original row and Telegram identity; no
// duplicate account is created just to add an email/password login.
function passwordAccountActive_(row, accountType) {
  const status = cleanText_(row && row["Статус"]).toLowerCase();
  return accountType === "Агент"
    ? ["одобрен", "approved", "active", "активен"].indexOf(status) !== -1
    : status === "активен";
}

function passwordAccounts_() {
  const usersSheet = getUsersSheet_(), agentsSheet = getAgentsSheet_();
  const users = sheetRowsAsObjects_(usersSheet, USER_HEADERS)
    .map((row) => Object.assign({}, row, { _account_type: "Пользователь", _account_sheet: usersSheet, _account_headers: USER_HEADERS }));
  const agents = sheetRowsAsObjects_(agentsSheet, AGENT_HEADERS)
    .map((row) => Object.assign({}, row, { _account_type: "Агент", _account_sheet: agentsSheet, _account_headers: AGENT_HEADERS }));
  return users.concat(agents);
}

function passwordAccountByTelegram_(telegramId, accountType) {
  const id = cleanText_(telegramId);
  const matches = passwordAccounts_().filter((row) => cleanText_(row.telegram_id) === id
    && (!accountType || row._account_type === accountType));
  // A Telegram identity can be present in both "Пользователи" and "Агенты".
  // Keep the legacy first-match behavior for callers that do not specify a role,
  // but fail closed if a role-specific lookup is ambiguous.
  if (accountType) return matches.length === 1 ? matches[0] : null;
  return matches[0] || null;
}

function passwordAccountByEmail_(email) {
  const normalized = normalizeEmail_(email);
  return passwordAccounts_().find((row) => normalizeEmail_(row.Email) === normalized) || null;
}

// This sheet is the source of truth for access via email/password. It contains
// no password data. Deleting a row revokes the account immediately: the next
// request and the next password login are refused until the person registers
// again and confirms their email.
function getAuthorizedUsersSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(AUTHORIZED_USERS_SHEET_NAME)
    || spreadsheet.insertSheet(AUTHORIZED_USERS_SHEET_NAME);
  ensureHeaders_(sheet, AUTHORIZED_USER_HEADERS);
  return sheet;
}

function authorizedUserRow_(webUserId) {
  const userId = cleanText_(webUserId);
  if (!userId) return null;
  const sheet = getAuthorizedUsersSheet_();
  const headers = ensureHeaders_(sheet, AUTHORIZED_USER_HEADERS);
  const rowNumber = findValueRow_(sheet, headers["ID пользователя"], userId);
  if (!rowNumber) return null;
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const row = { _row: rowNumber };
  AUTHORIZED_USER_HEADERS.forEach((header) => { row[header] = cleanText_(values[headers[header] - 1]); });
  return row;
}

function authorizeUser_(user) {
  const userId = cleanText_(user.web_user_id);
  const email = normalizeEmail_(user.Email || user.email);
  if (!userId || !email) return false;
  const sheet = getAuthorizedUsersSheet_();
  const headers = ensureHeaders_(sheet, AUTHORIZED_USER_HEADERS);
  const rowNumber = findValueRow_(sheet, headers["ID пользователя"], userId) || Math.max(sheet.getLastRow() + 1, 2);
  const current = rowNumber <= sheet.getLastRow()
    ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0]
    : new Array(sheet.getLastColumn()).fill("");
  const write = (header, value) => { current[headers[header] - 1] = safeSheetValue_(value); };
  const now = new Date();
  write("ID пользователя", userId);
  write("Имя", cleanText_(user["Имя"] || user.name) || "Пользователь");
  write("Телефон", cleanText_(user["Телефон"] || user.phone));
  write("Email", email);
  if (!current[headers["Дата авторизации"] - 1]) write("Дата авторизации", now);
  write("Последний вход", now);
  sheet.getRange(rowNumber, 1, 1, current.length).setValues([current]);
  return true;
}

function sendPasswordCode_(email, code, subject, text) {
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: text + ": " + code + "\n\nКод действует 10 минут. Никому его не сообщайте.",
    name: "Liberterra",
  });
}

function sendPasswordCodeToTelegram_(telegramId, code, text) {
  const chatId = cleanText_(telegramId);
  const botToken = cleanText_(PropertiesService.getScriptProperties().getProperty("BOT_TOKEN"));
  if (!chatId || !botToken) return false;
  try {
    const response = UrlFetchApp.fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: chatId,
        text: "Liberterra\n\n" + text + ": " + code + "\n\nКод действует 10 минут. Никому его не сообщайте.",
        disable_web_page_preview: true,
      }),
      muteHttpExceptions: true,
    });
    const body = JSON.parse(response.getContentText() || "{}");
    return response.getResponseCode() >= 200 && response.getResponseCode() < 300 && body.ok === true;
  } catch (error) {
    console.error("Telegram password code delivery failed: " + (error && error.message ? error.message : error));
    return false;
  }
}

function deliverPasswordCode_(email, telegramId, code, subject, text) {
  try {
    sendPasswordCode_(email, code, subject, text);
    return { ok: true, channel: "email" };
  } catch (error) {
    console.error("Email password code delivery failed: " + (error && error.message ? error.message : error));
  }
  if (sendPasswordCodeToTelegram_(telegramId, code, text)) return { ok: true, channel: "telegram" };
  return { ok: false, channel: "" };
}

function passwordRegisterStart_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const email = normalizeEmail_(payload.email);
  const name = cleanText_(payload.full_name).slice(0, 120);
  const phone = cleanText_(payload.phone).slice(0, 40);
  const code = cleanText_(payload.code);
  if (!email || name.length < 2 || !isValidWorkPhone_(phone) || !/^[0-9]{6}$/.test(code) || !validPasswordRecord_(payload)) return { ok: false, error: "invalid_registration" };
  const sheet = getUsersSheet_();
  const headers = ensureHeaders_(sheet, USER_HEADERS);
  const existingRow = findValueRow_(sheet, headers.Email, email);
  if (existingRow) {
    const existingValues = sheet.getRange(existingRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    const existing = {}; Object.keys(headers).forEach((header) => existing[header] = existingValues[headers[header] - 1]);
    if (authorizedUserRow_(cleanText_(existing.web_user_id))) return { ok: false, error: "account_exists" };
  }
  const cache = CacheService.getScriptCache();
  const key = passwordChallengeKey_("register", email);
  if (cache.get(key)) return { ok: false, error: "retry_later" };
  cache.put(key, JSON.stringify({ hash: emailCodeHash_(email, code), attempts: 0, email: email, name: name, phone: phone, accountType: "Пользователь", passwordSalt: cleanText_(payload.password_salt), passwordHash: cleanText_(payload.password_hash), passwordIterations: Number(payload.password_iterations) }), 10 * 60);
  sendPasswordCode_(email, code, "Подтверждение регистрации Liberterra", "Ваш код для создания аккаунта Liberterra");
  return { ok: true, expires_in: 600 };
}

function verifyPasswordChallenge_(kind, payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const email = normalizeEmail_(payload.email);
  const code = cleanText_(payload.code);
  if (!email || !/^[0-9]{6}$/.test(code)) return { ok: false, error: "invalid_code" };
  const cache = CacheService.getScriptCache();
  const key = passwordChallengeKey_(kind, email);
  const raw = cache.get(key);
  if (!raw) return { ok: false, error: "code_expired" };
  let challenge;
  try { challenge = JSON.parse(raw); } catch (_) { cache.remove(key); return { ok: false, error: "code_expired" }; }
  if (Number(challenge.attempts || 0) >= 5) { cache.remove(key); return { ok: false, error: "too_many_attempts" }; }
  if (!constantTimeEqual_(emailCodeHash_(email, code), cleanText_(challenge.hash))) {
    challenge.attempts = Number(challenge.attempts || 0) + 1;
    cache.put(key, JSON.stringify(challenge), 10 * 60);
    return { ok: false, error: "invalid_code" };
  }
  cache.remove(key);
  return { ok: true, email: email, challenge: challenge };
}

function passwordRegisterVerify_(payload) {
  const verified = verifyPasswordChallenge_("register", payload);
  if (!verified.ok) return verified;
  const sheet = getUsersSheet_();
  const headers = ensureHeaders_(sheet, USER_HEADERS);
  const existingRow = findValueRow_(sheet, headers.Email, verified.email);
  const row = existingRow || Math.max(sheet.getLastRow() + 1, 2);
  const values = existingRow ? sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0] : new Array(sheet.getLastColumn()).fill("");
  const write = (header, value) => { if (headers[header]) values[headers[header] - 1] = safeSheetValue_(value); };
  const now = new Date();
  write("web_user_id", cleanText_(values[headers.web_user_id - 1]) || Utilities.getUuid()); write("Email", verified.email); write("Email подтверждён", now);
  write("Имя", cleanText_(values[headers["Имя"] - 1]) || verified.challenge.name); write("Телефон", cleanText_(values[headers["Телефон"] - 1]) || verified.challenge.phone); write("Тип", "Пользователь"); write("Статус", "активен");
  write("Дата регистрации", now); write("Первый вход", now); write("Последний вход", now); write("Обновлено", now); write("Уведомления", "да");
  write("password_salt", verified.challenge.passwordSalt); write("password_hash", verified.challenge.passwordHash); write("password_iterations", verified.challenge.passwordIterations); write("Пароль обновлён", now);
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
  const user = {}; Object.keys(headers).forEach((header) => user[header] = values[headers[header] - 1]);
  authorizeUser_(user);
  return { ok: true, registered: true, user: userForPasswordAuth_(user) };
}

function passwordSetStart_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const email = normalizeEmail_(payload.email), code = cleanText_(payload.code);
  if (!email || !/^[0-9]{6}$/.test(code) || !validPasswordRecord_(payload)) return { ok: false, error: "invalid_password_setup" };
  const account = passwordAccountByEmail_(email);
  if (!account || !passwordAccountActive_(account, account._account_type)) return { ok: false, error: "account_not_found" };
  const cache = CacheService.getScriptCache(), key = passwordChallengeKey_("set", email);
  if (cache.get(key)) return { ok: false, error: "retry_later" };
  cache.put(key, JSON.stringify({ hash: emailCodeHash_(email, code), attempts: 0, passwordSalt: cleanText_(payload.password_salt), passwordHash: cleanText_(payload.password_hash), passwordIterations: Number(payload.password_iterations) }), 10 * 60);
    const delivery = deliverPasswordCode_(email, account.telegram_id, code, "Подтверждение пароля Liberterra", "Ваш код для установки нового пароля Liberterra");
  if (!delivery.ok) { cache.remove(key); return { ok: false, error: "code_delivery_failed" }; }
  return { ok: true, expires_in: 600, delivery_channel: delivery.channel };


}
function passwordSetVerify_(payload) {
  const verified = verifyPasswordChallenge_("set", payload);
  if (!verified.ok) return verified;
  const account = passwordAccountByEmail_(verified.email);
  if (!account || !passwordAccountActive_(account, account._account_type)) return { ok: false, error: "account_not_found" };
  const sheet = account._account_sheet, headers = ensureHeaders_(sheet, account._account_headers), row = account._row;
  sheet.getRange(row, headers.password_salt).setValue(verified.challenge.passwordSalt);
  sheet.getRange(row, headers.password_hash).setValue(verified.challenge.passwordHash);
  sheet.getRange(row, headers.password_iterations).setValue(verified.challenge.passwordIterations);
  sheet.getRange(row, headers["Пароль обновлён"]).setValue(new Date());
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const user = {}; Object.keys(headers).forEach((header) => user[header] = values[headers[header] - 1]);
  user._account_type = account._account_type;
  authorizeUser_(user);
  return { ok: true, registered: true, user: userForPasswordAuth_(user) };
}

function getAccessClaimsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(ACCESS_CLAIMS_SHEET_NAME)
    || spreadsheet.insertSheet(ACCESS_CLAIMS_SHEET_NAME);
  ensureHeaders_(sheet, ACCESS_CLAIM_HEADERS);
  return sheet;
}

function accessClaimAgentByPhone_(phone) {
  const digits = normalizedPhoneDigits_(phone);
  if (digits.length !== 12 || digits.indexOf("996") !== 0) return null;
  const matches = passwordAccounts_().filter((row) => row._account_type === "Агент"
    && passwordAccountActive_(row, row._account_type)
    && normalizedPhoneDigits_(row["Телефон"]) === digits);
  return matches.length === 1 ? matches[0] : null;
}

function passwordClaimStart_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const email = normalizeEmail_(payload.email);
  const phone = cleanText_(payload.phone).slice(0, 40);
  const code = cleanText_(payload.code);
  if (!email || !isValidWorkPhone_(phone) || !/^[0-9]{6}$/.test(code) || !validPasswordRecord_(payload)) {
    return { ok: false, error: "invalid_claim" };
  }
  const account = accessClaimAgentByPhone_(phone);
  if (!account) return { ok: false, error: "agent_not_found" };
  const emailAccount = passwordAccountByEmail_(email);
  if (emailAccount && (emailAccount._account_sheet !== account._account_sheet || emailAccount._row !== account._row)) {
    return { ok: false, error: "email_in_use" };
  }
  const cache = CacheService.getScriptCache();
  const key = passwordChallengeKey_("claim", email);
  if (cache.get(key)) return { ok: false, error: "retry_later" };
  cache.put(key, JSON.stringify({
    hash: emailCodeHash_(email, code), attempts: 0, telegramId: cleanText_(account.telegram_id),
    phone: phone, name: cleanText_(account["Имя"]), passwordSalt: cleanText_(payload.password_salt),
    passwordHash: cleanText_(payload.password_hash), passwordIterations: Number(payload.password_iterations)
  }), 10 * 60);
  const delivery = deliverPasswordCode_(email, account.telegram_id, code, "Подтверждение доступа Liberterra", "Ваш код для заявки на доступ к существующему профилю");
  if (!delivery.ok) { cache.remove(key); return { ok: false, error: "code_delivery_failed" }; }
  return { ok: true, expires_in: 600, delivery_channel: delivery.channel };
}

function passwordClaimVerify_(payload) {
  const verified = verifyPasswordChallenge_("claim", payload);
  if (!verified.ok) return verified;
  const account = passwordAccountByTelegram_(verified.challenge.telegramId, "Агент");
  if (!account || account._account_type !== "Агент" || !passwordAccountActive_(account, account._account_type)
      || normalizedPhoneDigits_(account["Телефон"]) !== normalizedPhoneDigits_(verified.challenge.phone)) {
    return { ok: false, error: "agent_not_found" };
  }
  const claims = getAccessClaimsSheet_();
  const headers = ensureHeaders_(claims, ACCESS_CLAIM_HEADERS);
  const existing = findValueRow_(claims, headers.Email, verified.email);
  const rowNumber = existing || Math.max(claims.getLastRow() + 1, 2);
  const values = existing ? claims.getRange(rowNumber, 1, 1, claims.getLastColumn()).getValues()[0] : new Array(claims.getLastColumn()).fill("");
  const write = (header, value) => { values[headers[header] - 1] = safeSheetValue_(value); };
  write("ID заявки", cleanText_(values[headers["ID заявки"] - 1]) || Utilities.getUuid());
  write("telegram_id", cleanText_(account.telegram_id));
  write("Имя", cleanText_(account["Имя"]));
  write("Телефон", cleanText_(account["Телефон"]));
  write("Email", verified.email);
  write("password_salt", verified.challenge.passwordSalt);
  write("password_hash", verified.challenge.passwordHash);
  write("password_iterations", verified.challenge.passwordIterations);
  write("Статус", "на проверке");
  write("Дата заявки", new Date());
  write("Дата решения", "");
  claims.getRange(rowNumber, 1, 1, values.length).setValues([values]);
  return { ok: true, pending_approval: true };
}

function approvedAccessClaimByEmail_(email) {
  const sheet = getAccessClaimsSheet_();
  const headers = ensureHeaders_(sheet, ACCESS_CLAIM_HEADERS);
  const rowNumber = findValueRow_(sheet, headers.Email, normalizeEmail_(email));
  if (!rowNumber) return null;
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = { _row: rowNumber, _sheet: sheet, _headers: headers };
  ACCESS_CLAIM_HEADERS.forEach((header) => { row[header] = values[headers[header] - 1]; });
  const status = cleanText_(row["Статус"]).toLowerCase();
  return ["одобрен", "одобрено", "approved"].indexOf(status) !== -1 ? row : null;
}

function activateApprovedAccessClaim_(claim) {
  const account = passwordAccountByTelegram_(claim.telegram_id, "Агент");
  if (!account || account._account_type !== "Агент" || !passwordAccountActive_(account, account._account_type)) return null;
  const sheet = account._account_sheet;
  const headers = ensureHeaders_(sheet, account._account_headers);
  const values = sheet.getRange(account._row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const write = (header, value) => { if (headers[header]) values[headers[header] - 1] = safeSheetValue_(value); };
  write("web_user_id", cleanText_(values[headers.web_user_id - 1]) || Utilities.getUuid());
  write("Email", normalizeEmail_(claim.Email));
  write("Email подтверждён", new Date());
  write("password_salt", cleanText_(claim.password_salt));
  write("password_hash", cleanText_(claim.password_hash));
  write("password_iterations", Number(claim.password_iterations));
  write("Пароль обновлён", new Date());
  sheet.getRange(account._row, 1, 1, values.length).setValues([values]);
  const user = {}; Object.keys(headers).forEach((header) => { user[header] = values[headers[header] - 1]; });
  user._account_type = "Агент";
  authorizeUser_(user);
  claim._sheet.getRange(claim._row, claim._headers["Статус"]).setValue("активирован");
  claim._sheet.getRange(claim._row, claim._headers["Дата решения"]).setValue(new Date());
  return user;
}

// The Worker validates Telegram init data before calling these functions. The
// shared secret makes this server-to-server route unavailable to browsers.
function telegramPasswordLinkStart_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const telegramId = cleanText_(payload.telegram_id);
  const email = normalizeEmail_(payload.email), code = cleanText_(payload.code);
  if (!/^\d+$/.test(telegramId) || !email || !/^[0-9]{6}$/.test(code) || !validPasswordRecord_(payload)) return { ok: false, error: "invalid_password_setup" };
  const account = passwordAccountByTelegram_(telegramId);
  if (!account || !passwordAccountActive_(account, account._account_type)) return { ok: false, error: "account_not_found" };
  const sheet = account._account_sheet, headers = ensureHeaders_(sheet, account._account_headers);
  const values = sheet.getRange(account._row, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const ownEmail = normalizeEmail_(values[headers.Email - 1]);
  const emailAccount = passwordAccountByEmail_(email);
  if ((ownEmail && ownEmail !== email) || (emailAccount && (emailAccount._account_sheet !== account._account_sheet || emailAccount._row !== account._row))) return { ok: false, error: "email_in_use" };
  const cache = CacheService.getScriptCache(), key = passwordChallengeKey_("telegram-link", email);
  if (cache.get(key)) return { ok: false, error: "retry_later" };
  cache.put(key, JSON.stringify({ hash: emailCodeHash_(email, code), attempts: 0, telegramId: telegramId, accountType: account._account_type, email: email, passwordSalt: cleanText_(payload.password_salt), passwordHash: cleanText_(payload.password_hash), passwordIterations: Number(payload.password_iterations) }), 10 * 60);
  sendPasswordCode_(email, code, "Подтверждение входа Liberterra", "Ваш код для привязки email и пароля к аккаунту Liberterra");
  return { ok: true, expires_in: 600 };
}

function telegramPasswordLinkVerify_(payload) {
  const verified = verifyPasswordChallenge_("telegram-link", payload);
  if (!verified.ok) return verified;
  const telegramId = cleanText_(payload.telegram_id);
  if (!/^\d+$/.test(telegramId) || telegramId !== cleanText_(verified.challenge.telegramId)) return { ok: false, error: "telegram_required" };
  const account = passwordAccountByTelegram_(telegramId);
  const emailAccount = passwordAccountByEmail_(verified.email);
  if (!account || !passwordAccountActive_(account, account._account_type) || (emailAccount && (emailAccount._account_sheet !== account._account_sheet || emailAccount._row !== account._row))) return { ok: false, error: "email_in_use" };
  const sheet = account._account_sheet, headers = ensureHeaders_(sheet, account._account_headers);
  const values = sheet.getRange(account._row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const write = (header, value) => { if (headers[header]) values[headers[header] - 1] = safeSheetValue_(value); };
  write("web_user_id", cleanText_(values[headers.web_user_id - 1]) || Utilities.getUuid());
  write("Email", verified.email); write("Email подтверждён", new Date());
  write("password_salt", verified.challenge.passwordSalt); write("password_hash", verified.challenge.passwordHash);
  write("password_iterations", verified.challenge.passwordIterations); write("Пароль обновлён", new Date()); write("Обновлено", new Date());
  sheet.getRange(account._row, 1, 1, values.length).setValues([values]);
  const user = {}; Object.keys(headers).forEach((header) => user[header] = values[headers[header] - 1]);
  user._account_type = account._account_type;
  authorizeUser_(user);
  return { ok: true, registered: true, linked: true, user: userForPasswordAuth_(user) };
}

function passwordAuthRecord_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const email = normalizeEmail_(payload.email);
  if (!email) return { ok: false, error: "invalid_credentials" };
  const key = "password-login:" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email)).replace(/=+$/g, "");
  const cache = CacheService.getScriptCache();
  const attempts = Number(cache.get(key) || 0);
  if (attempts >= 12) return { ok: false, error: "retry_later" };
  cache.put(key, String(attempts + 1), 10 * 60);
  let row = passwordAccountByEmail_(email);
  if (!row) {
    const claim = approvedAccessClaimByEmail_(email);
    if (claim) row = activateApprovedAccessClaim_(claim);
  }
  if (!row || !passwordAccountActive_(row, row._account_type) || !cleanText_(row.password_hash) || !cleanText_(row.password_salt) || !authorizedUserRow_(cleanText_(row.web_user_id))) return { ok: true, record: null };
  cache.remove(key);
  authorizeUser_(row);
  return { ok: true, record: { password_salt: cleanText_(row.password_salt), password_hash: cleanText_(row.password_hash), password_iterations: Number(row.password_iterations) || 100000, user: userForPasswordAuth_(row) } };
}

function webSessionStatus_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const row = authorizedUserRow_(payload.web_user_id);
  if (!row) return { ok: true, authorized: false };
  const email = normalizeEmail_(payload.email);
  if (!email || email !== normalizeEmail_(row.Email)) return { ok: true, authorized: false };
  return { ok: true, authorized: true };
}

// Message actions are accepted only from the Worker. The browser never receives
// this secret; the Worker derives the actor from a signed email session or from
// verified Telegram init data before forwarding the request here.
function messageGatewayAuthorized_(payload) {
  return emailAuthAuthorized_(payload);
}

function messageActorContext_(payload) {
  if (!messageGatewayAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const actorKey = cleanText_(payload.actor_key);
  if (!/^(web|tg):[A-Za-z0-9_-]{3,120}$/.test(actorKey)) return { ok: false, error: "invalid_session" };

  if (actorKey.indexOf("web:") === 0) {
    const users = sheetRowsAsObjects_(getUsersSheet_(), USER_HEADERS);
    const user = users.find((row) => cleanText_(row.web_user_id) === actorKey.slice(4));
    if (!user || cleanText_(user["Статус"]).toLowerCase() !== "активен") return { ok: false, error: "registration_required" };
    return { ok: true, key: actorKey, role: "client", name: cleanText_(user["Имя"]) || "Пользователь" };
  }

  const telegramId = actorKey.slice(3);
  const agent = agentRecordById_(telegramId);
  if (agent && agent.role === "approved") return { ok: true, key: actorKey, role: "agent", agentId: telegramId, name: agent.name || "Агент Liberterra" };
  const users = sheetRowsAsObjects_(getUsersSheet_(), USER_HEADERS);
  const user = users.find((row) => cleanText_(row.telegram_id) === telegramId);
  if (!user || cleanText_(user["Статус"]).toLowerCase() !== "активен") return { ok: false, error: "registration_required" };
  return { ok: true, key: actorKey, role: "client", name: cleanText_(user["Имя"]) || "Пользователь" };
}

function getMessageThreadsSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MESSAGE_THREADS_SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet(MESSAGE_THREADS_SHEET_NAME);
  ensureHeaders_(sheet, MESSAGE_THREAD_HEADERS);
  return sheet;
}

function getMessageEntriesSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MESSAGE_ENTRIES_SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet(MESSAGE_ENTRIES_SHEET_NAME);
  ensureHeaders_(sheet, MESSAGE_ENTRY_HEADERS);
  return sheet;
}

function safeMessageText_(value) {
  return cleanText_(value).replace(/\r\n?/g, "\n").slice(0, MAX_MESSAGE_LENGTH);
}

function messageRateLimitAllowed_(actorKey) {
  const cache = CacheService.getScriptCache();
  const key = "message-rate:" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, actorKey)).replace(/=+$/g, "");
  const count = Number(cache.get(key) || 0);
  if (count >= MESSAGE_RATE_LIMIT) return false;
  cache.put(key, String(count + 1), MESSAGE_RATE_WINDOW_SECONDS);
  return true;
}

function messageThreadVisibleTo_(thread, actor) {
  return actor.role === "agent"
    ? cleanText_(thread.agent_id) === cleanText_(actor.agentId)
    : cleanText_(thread.client_key) === actor.key;
}

function messageThreadSummary_(thread, entries, actor) {
  const object = findCatalogRecord_(thread.object_id);
  const agent = agentRecordById_(thread.agent_id);
  const latest = entries.filter((entry) => cleanText_(entry.thread_id) === cleanText_(thread.thread_id))
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];
  const unread = entries.filter((entry) => cleanText_(entry.thread_id) === cleanText_(thread.thread_id)
    && cleanText_(entry.recipient_key) === actor.key && !cleanText_(entry.read_at)).length;
  return {
    thread_id: cleanText_(thread.thread_id),
    object_id: cleanText_(thread.object_id),
    object_title: cleanText_(object && object.row && object.row.title) || "Объект Liberterra",
    object_photo: cleanText_(object && object.row && object.row.photo_url),
    agent_name: agent ? agent.name : "Агент Liberterra",
    updated_at: thread.updated_at,
    last_message: latest ? safeMessageText_(latest.text) : "",
    last_message_at: latest ? latest.created_at : thread.last_message_at,
    unread_count: unread,
  };
}

function messageAction_(payload, action) {
  const actor = messageActorContext_(payload);
  if (!actor.ok) return actor;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: "busy" };
  try {
    const threadSheet = getMessageThreadsSheet_();
    const entrySheet = getMessageEntriesSheet_();
    const threads = sheetRowsAsObjects_(threadSheet, MESSAGE_THREAD_HEADERS);
    const entries = sheetRowsAsObjects_(entrySheet, MESSAGE_ENTRY_HEADERS);

    if (action === "list_message_threads") {
      const visible = threads.filter((thread) => messageThreadVisibleTo_(thread, actor));
      const items = visible.map((thread) => messageThreadSummary_(thread, entries, actor))
        .sort((left, right) => new Date(right.last_message_at || right.updated_at).getTime() - new Date(left.last_message_at || left.updated_at).getTime());
      return { ok: true, threads: items, unread_count: items.reduce((sum, item) => sum + item.unread_count, 0) };
    }

    if (action === "open_message_thread") {
      if (actor.role !== "client") return { ok: false, error: "client_only" };
      const objectId = normalizeObjectId_(payload.object_id);
      const record = findCatalogRecord_(objectId);
      if (!record || record.kind !== "object" || !isPublicCrmObject_(record.row)) return { ok: false, error: "object_unavailable" };
      const agentId = listingAgentIdForObject_(objectId);
      const listingAgent = agentId && agentRecordById_(agentId);
      if (!listingAgent || listingAgent.role !== "approved") return { ok: false, error: "agent_unavailable" };
      let thread = threads.find((row) => cleanText_(row.object_id) === objectId && cleanText_(row.client_key) === actor.key && cleanText_(row.agent_id) === agentId);
      const now = new Date();
      if (!thread) {
        const newRow = [Utilities.getUuid(), objectId, actor.key, agentId, now, now, ""];
        threadSheet.appendRow(newRow);
        thread = MESSAGE_THREAD_HEADERS.reduce((value, header, index) => { value[header] = newRow[index]; return value; }, {});
      }
      return { ok: true, thread: messageThreadSummary_(thread, entries, actor) };
    }

    const threadId = cleanText_(payload.thread_id);
    const thread = threads.find((row) => cleanText_(row.thread_id) === threadId);
    if (!thread || !messageThreadVisibleTo_(thread, actor)) return { ok: false, error: "thread_not_found" };

    if (action === "read_message_thread") {
      const unreadRows = entries.filter((entry) => cleanText_(entry.thread_id) === threadId && cleanText_(entry.recipient_key) === actor.key && !cleanText_(entry.read_at));
      const headers = ensureHeaders_(entrySheet, MESSAGE_ENTRY_HEADERS);
      unreadRows.forEach((entry) => entrySheet.getRange(entry._row, headers.read_at).setValue(new Date()));
      const messages = entries.filter((entry) => cleanText_(entry.thread_id) === threadId).map((entry) => ({
        message_id: cleanText_(entry.message_id), sender_key: cleanText_(entry.sender_key), sender_name: cleanText_(entry.sender_name),
        text: safeMessageText_(entry.text), created_at: entry.created_at, mine: cleanText_(entry.sender_key) === actor.key,
      })).sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
      return { ok: true, thread: messageThreadSummary_(thread, entries, actor), messages: messages };
    }

    if (action === "send_message") {
      const text = safeMessageText_(payload.text);
      if (!text) return { ok: false, error: "message_required" };
      if (!messageRateLimitAllowed_(actor.key)) return { ok: false, error: "rate_limit" };
      const recipientKey = actor.role === "agent" ? cleanText_(thread.client_key) : "tg:" + cleanText_(thread.agent_id);
      const now = new Date();
      entrySheet.appendRow([Utilities.getUuid(), threadId, thread.object_id, actor.key, recipientKey, actor.name, safeSheetValue_(text), now, ""]);
      const headers = ensureHeaders_(threadSheet, MESSAGE_THREAD_HEADERS);
      threadSheet.getRange(thread._row, headers.updated_at).setValue(now);
      threadSheet.getRange(thread._row, headers.last_message_at).setValue(now);
      return { ok: true, sent_at: now };
    }
    return { ok: false, error: "unknown_action" };
  } finally {
    lock.releaseLock();
  }
}

function favoriteObjectIdsForUser_(telegramId) {
  return sheetRowsAsObjects_(getUserFavoritesSheet_(), USER_FAVORITE_HEADERS)
    .filter((row) => row.telegram_id === cleanText_(telegramId))
    .map((row) => normalizeObjectId_(row.object_id))
    .filter(Boolean);
}

function getUserProfile_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  return profileForUserContext_(context);
}

function profileForUserContext_(context) {
  const catalog = catalogRows_();
  const links = objectAgentLinks_();
  const photoAgent = agentRecordById_(context.telegramId);
  return {
    ok: true,
    user: {
      telegram_id: context.telegramId,
      name: context.name,
      phone: context.phone || "",
      account_type: context.accountType || "Пользователь",
      avatar_url: photoAgent ? photoAgent.avatar_url : "",
      can_edit_photo: Boolean(photoAgent && ["approved", "pending"].indexOf(photoAgent.role) !== -1),
    },
    own_object_count: ownObjectRecords_(context, catalog, links)
      .filter((record) => cleanText_(record.deal).toLowerCase() !== "запрос").length,
    own_request_count: ownRequestRecords_(context, catalog, links).length,
    favorite_object_ids: favoriteObjectIdsForUser_(context.telegramId),
  };
}

function getWebUserProfile_(payload) {
  if (!emailAuthAuthorized_(payload)) return { ok: false, error: "unauthorized" };
  const userId = cleanText_(payload.web_user_id);
  if (!userId) return { ok: false, error: "registration_required" };
  const row = passwordAccounts_().find((item) => cleanText_(item.web_user_id) === userId);
  if (!row || !passwordAccountActive_(row, row._account_type) || !authorizedUserRow_(userId)) return { ok: false, error: "registration_required" };
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  return profileForUserContext_(context);
}

function agentAvatarUrl_(fileId) {
  const id = cleanText_(fileId);
  return /^[a-zA-Z0-9_-]{20,100}$/.test(id)
    ? "https://drive.google.com/thumbnail?id=" + id + "&sz=w512" : "";
}

// Accept only bounded, square JPEGs. Canvas export strips phone metadata;
// reject EXIF on the server too, including uploads that bypass the browser.
function validAgentJpeg_(bytes) {
  if (!bytes || bytes.length < 12 || bytes.length > 150000) return false;
  const b = (i) => bytes[i] & 255;
  if (b(0) !== 255 || b(1) !== 216 || b(bytes.length - 2) !== 255 || b(bytes.length - 1) !== 217) return false;
  let pos = 2, dimensions = false;
  while (pos + 3 < bytes.length) {
    if (b(pos++) !== 255) return false;
    while (b(pos) === 255) pos++;
    const marker = b(pos++);
    if (marker === 218) return dimensions;
    const length = b(pos) * 256 + b(pos + 1);
    if (length < 2 || pos + length > bytes.length || marker === 225) return false;
    if (marker === 192 || marker === 194) {
      if (length < 8) return false;
      const height = b(pos + 3) * 256 + b(pos + 4);
      const width = b(pos + 5) * 256 + b(pos + 6);
      dimensions = width === height && width >= 64 && width <= 512;
    }
    pos += length;
  }
  return false;
}

function setAgentPhoto_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const targetId = cleanText_(payload.agent_id) || context.telegramId;
  if (targetId !== context.telegramId && !context.isAdmin) return { ok: false, error: "photo_access_denied" };
  const remove = payload.remove === true;
  let bytes = null;
  if (!remove) {
    const base64 = cleanText_(payload.photo_base64);
    if (base64.length > 200000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return { ok: false, error: "invalid_photo" };
    try { bytes = Utilities.base64Decode(base64); } catch (_) { return { ok: false, error: "invalid_photo" }; }
    if (!validAgentJpeg_(bytes)) return { ok: false, error: "invalid_photo" };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: "photo_busy" };
  let newFile = null;
  try {
    const sheet = getAgentsSheet_();
    const headers = ensureHeaders_(sheet, AGENT_HEADERS);
    const row = findAgentRow_(sheet, headers.telegram_id, targetId);
    if (!row) return { ok: false, error: "agent_not_found" };
    const role = roleFromStatus_(sheet.getRange(row, headers["Статус"]).getDisplayValue());
    if (!context.isAdmin && ["approved", "pending"].indexOf(role) === -1) return { ok: false, error: "photo_access_denied" };
    const cell = sheet.getRange(row, headers["Публичное фото ID"]);
    const oldId = cleanText_(cell.getDisplayValue());
    let oldFile = null;
    if (oldId) {
      oldFile = DriveApp.getFileById(oldId);
      // Never change sharing of a document or any file not created by this feature.
      if (oldFile.getDescription() !== "liberterra-avatar:" + targetId) return { ok: false, error: "photo_storage_mismatch" };
    }
    if (!remove) {
      const props = PropertiesService.getScriptProperties();
      let folderId = props.getProperty("AGENT_AVATARS_FOLDER_ID");
      if (!folderId) {
        const folder = DriveApp.createFolder("Liberterra — public agent avatars");
        folderId = folder.getId();
        props.setProperty("AGENT_AVATARS_FOLDER_ID", folderId);
      }
      newFile = DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes, "image/jpeg", Utilities.getUuid() + ".jpg"));
      newFile.setDescription("liberterra-avatar:" + targetId);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    // Revoke public access first. If the write fails, the old photo may be hidden,
    // but an allegedly deleted photo must not remain publicly shared.
    if (oldFile) oldFile.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    const newId = newFile ? newFile.getId() : "";
    cell.setValue(newId);
    SpreadsheetApp.flush();
    return { ok: true, avatar_url: agentAvatarUrl_(newId) };
  } catch (error) {
    if (newFile) {
      try { newFile.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE); } catch (_) {}
    }
    console.error("agent_photo_write_failed");
    return { ok: false, error: "photo_save_failed", message: "Не удалось сохранить фото. Обновите профиль и проверьте результат." };
  } finally { lock.releaseLock(); }
}

function setUserFavorite_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  if (!objectId || !getObjectRecordById_(objectId)) return { ok: false, error: "object_not_found" };
  const enabled = isTrue_(payload.enabled);
  const sheet = getUserFavoritesSheet_();
  const headerMap = ensureHeaders_(sheet, USER_FAVORITE_HEADERS);
  const rows = sheetRowsAsObjects_(sheet, USER_FAVORITE_HEADERS);
  const existing = rows.filter((row) => row.telegram_id === context.telegramId && objectIdsEqual_(row.object_id, objectId));
  if (enabled && !existing.length) {
    sheet.appendRow([safeSheetValue_(context.telegramId), safeSheetValue_(objectId), new Date()]);
  } else if (!enabled && existing.length) {
    existing.sort((left, right) => right._row - left._row).forEach((row) => sheet.deleteRow(row._row));
  }
  return { ok: true, object_id: objectId, enabled: enabled };
}

function setUserFavorites_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const requested = Array.isArray(payload.object_ids) ? payload.object_ids : [];
  const ids = [];
  requested.forEach((value) => {
    const id = normalizeObjectId_(value);
    if (id && ids.indexOf(id) === -1 && ids.length < 500) ids.push(id);
  });
  if (!ids.length) return { ok: true, object_ids: [] };

  const validIds = {};
  catalogRows_().forEach((row) => { validIds[normalizeObjectId_(row.id)] = true; });
  const sheet = getUserFavoritesSheet_();
  const existing = {};
  sheetRowsAsObjects_(sheet, USER_FAVORITE_HEADERS)
    .filter((row) => row.telegram_id === context.telegramId)
    .forEach((row) => { existing[normalizeObjectId_(row.object_id)] = true; });
  const added = ids.filter((id) => validIds[id] && !existing[id]);
  if (added.length) {
    const now = new Date();
    const rows = added.map((id) => [
      safeSheetValue_(context.telegramId),
      safeSheetValue_(id),
      now,
    ]);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, USER_FAVORITE_HEADERS.length).setValues(rows);
  }
  return { ok: true, object_ids: added };
}

function sheetRowsAsObjects_(sheet, requiredHeaders) {
  const headerMap = ensureHeaders_(sheet, requiredHeaders);
  if (sheet.getLastRow() < 2) {
    return [];
  }
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
  return values.map((row, index) => {
    const record = { _row: index + 2 };
    requiredHeaders.forEach((header) => {
      record[header] = cleanText_(row[headerMap[header] - 1]);
    });
    return record;
  });
}

function normalizeObjectId_(value) {
  const id = cleanText_(value);
  if (!id) return "";
  return /^\d+\.0+$/.test(id) ? id.replace(/\.0+$/, "") : id;
}

function objectIdsEqual_(left, right) {
  return normalizeObjectId_(left) === normalizeObjectId_(right);
}

function getObjectRecordById_(objectId, catalog) {
  const id = normalizeObjectId_(objectId);
  if (!id) return null;
  const found = findCatalogRecord_(id, catalog);
  return found ? found.row : null;
}

function safeAgentCrmObject_(record) {
  if (!record) return null;
  return AGENT_CRM_OBJECT_HEADERS.reduce((result, header) => {
    result[header] = cleanText_(record[header]);
    return result;
  }, {});
}

function normalizedObjectStatus_(value) {
  const status = cleanText_(value).toLowerCase().replace(/ё/g, "е");
  if (["опубликован", "published", "active", "активен"].indexOf(status) !== -1) return "active";
  if (["на модерации", "pending", "moderation", "проверка"].indexOf(status) !== -1) return "moderation";
  if (["снят", "снято", "removed", "архив", "archive", "неактуален"].indexOf(status) !== -1) return "removed";
  return "moderation";
}

function objectStatusValue_(value) {
  const normalized = normalizedObjectStatus_(value);
  if (normalized === "active") return "опубликован";
  if (normalized === "removed") return "снят";
  return "на модерации";
}

function isPublicCrmObject_(record) {
  if (!record || normalizedObjectStatus_(record.status) !== "active") return false;
  const hasContract = PRIVATE_CONTRACT_HEADERS.slice(0, 4).some((header) => cleanText_(record[header]));
  return !hasContract || isTrue_(record.contract_signed);
}

function readPublicSheetRows_(sheet, requiredHeaders) {
  if (!sheet) return [];
  // One batched read includes headers. Public reads must not create sheets/columns.
  const values = sheet.getDataRange().getDisplayValues();
  const columns = headerMap_((values[0] || []).map(cleanText_));
  return values.slice(1).map((row, index) => {
    const record = { _row: index + 2 };
    requiredHeaders.forEach((header) => {
      record[header] = cleanText_(row[columns[header] - 1]);
    });
    return record;
  });
}

function objectAgentLinks_(readOnly) {
  if (readOnly) return readPublicSheetRows_(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(OBJECT_AGENT_LINKS_SHEET_NAME),
    ["object_id", "listing_agent_id", "poster_type"]
  );
  return sheetRowsAsObjects_(
    getObjectAgentLinksSheet_(),
    ["object_id", "listing_agent_id", "poster_type"]
  );
}

function listingAgentIdForObject_(objectId, links) {
  const id = normalizeObjectId_(objectId);
  const link = (links || objectAgentLinks_()).find((row) => (
    objectIdsEqual_(row.object_id, id)
  ));
  return link ? cleanText_(link.listing_agent_id) : "";
}

function ownObjectIds_(agentId, links) {
  return (links || objectAgentLinks_())
    .filter((row) => ownsListingKey_(agentId, row.listing_agent_id))
    .map((row) => row.object_id)
    .filter(Boolean);
}

function ownObjectRecords_(agentId, catalog, links) {
  const linkedIds = {};
  ownObjectIds_(agentId, links).forEach((objectId) => {
    linkedIds[normalizeObjectId_(objectId)] = true;
  });
  return objectRows_(catalog)
    .filter((record) => linkedIds[normalizeObjectId_(record.id)]);
}

function agentRecordById_(agentId) {
  const id = cleanText_(agentId);
  if (!id) return null;
  const sheet = getAgentsSheet_();
  const headerMap = ensureHeaders_(sheet, AGENT_HEADERS);
  const rowNumber = findAgentRow_(sheet, headerMap.telegram_id, id);
  if (!rowNumber) return null;
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  return {
    telegram_id: id,
    avatar_url: agentAvatarUrl_(values[headerMap["Публичное фото ID"] - 1]),
    name: cleanText_(values[headerMap["Имя"] - 1]) || "Агент Liberterra",
    agency: cleanText_(values[headerMap["Агентство"] - 1]),
    specialization: normalizeAgentSpecialization_(values[headerMap["Направление"] - 1]),
    role: roleFromStatus_(values[headerMap["Статус"] - 1]),
    rating: normalizeAgentRating_(values[headerMap["Рейтинг"] - 1]),
    experience: cleanText_(values[headerMap["Опыт"] - 1]),
  };
}

function publicAgentRef_(agentId, suppliedToken) {
  const token = suppliedToken === undefined
    ? cleanText_(PropertiesService.getScriptProperties().getProperty("BOT_TOKEN"))
    : suppliedToken;
  if (!token || !cleanText_(agentId)) return "";
  return bytesToHex_(
    Utilities.computeHmacSha256Signature("agent-public:" + cleanText_(agentId), token)
  ).slice(0, 24);
}

function agentByPublicRef_(agentRef) {
  const ref = cleanText_(agentRef);
  if (!/^[a-f0-9]{24}$/i.test(ref)) return null;
  const rows = readPublicSheetRows_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AGENTS_SHEET_NAME), AGENT_HEADERS);
  const headerId = "telegram_id";
  const token = cleanText_(PropertiesService.getScriptProperties().getProperty("BOT_TOKEN"));
  for (let index = 0; index < rows.length; index += 1) {
    const agentId = cleanText_(rows[index][headerId]);
    if (
      roleFromStatus_(rows[index]["Статус"]) === "approved"
      && constantTimeEqual_(publicAgentRef_(agentId, token), ref)
    ) {
      return {
        telegram_id: agentId,
        avatar_url: agentAvatarUrl_(rows[index]["Публичное фото ID"]),
        name: cleanText_(rows[index]["Имя"]) || "Агент Liberterra",
        agency: cleanText_(rows[index]["Агентство"]),
        specialization: normalizeAgentSpecialization_(rows[index]["Направление"]),
        rating: normalizeAgentRating_(rows[index]["Рейтинг"]),
        experience: cleanText_(rows[index]["Опыт"]),
        public_ref: ref,
      };
    }
  }
  return null;
}

function approvedCanAccessObject_(context, record, links) {
  if (!context || !context.ok || !record) return false;
  return context.isAdmin || ownsListingKey_(context, listingAgentIdForObject_(record.id, links)) || isPublicCrmObject_(record);
}

function getAgentDashboard_(payload) {
  const context = approvedAgentContext_(payload);
  if (!context.ok) return context;

  const catalog = catalogRows_();
  const links = objectAgentLinks_();
  const objects = ownObjectRecords_(context, catalog, links)
    .map(safeAgentCrmObject_)
    .filter(Boolean);
  const objectById = {};
  objects.forEach((item) => { objectById[normalizeObjectId_(item.id)] = item; });
  const counters = { active: 0, moderation: 0, removed: 0 };
  objects.forEach((item) => {
    counters[normalizedObjectStatus_(item.status)] += 1;
  });

  const notes = sheetRowsAsObjects_(getAgentNotesSheet_(), AGENT_NOTE_HEADERS)
    .filter((row) => row.agent_id === context.telegramId)
    .map((row) => ({
      object_id: row.object_id,
      note: row.note,
      updated_at: row.updated_at,
    }));

  const claims = sheetRowsAsObjects_(getAgentClientsSheet_(), AGENT_CLIENT_HEADERS)
    .filter((row) => row.agent_id === context.telegramId && row.status !== "released")
    .map((row) => ({
      claim_id: row.claim_id,
      object_id: row.object_id,
      client_label: row.client_label,
      created_at: row.created_at,
      object: objectById[normalizeObjectId_(row.object_id)] || null,
    }));

  return {
    ok: true,
    role: "approved",
    agent: {
      name: context.name,
      specialization: context.specialization,
      public_ref: publicAgentRef_(context.telegramId),
    },
    counters: counters,
    objects: objects,
    notes: notes,
    clients: claims,
  };
}

function getAgentObjectWorkspace_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  const catalog = catalogRows_();
  const links = objectAgentLinks_();
  const record = getObjectRecordById_(objectId, catalog);
  if (!record) return { ok: false, error: "object_not_found" };
  if (!approvedCanAccessObject_(context, record, links)) {
    return { ok: false, error: "object_access_denied" };
  }

  const agentContext = approvedAgentContext_(payload, context);
  const note = agentContext.ok ? sheetRowsAsObjects_(getAgentNotesSheet_(), AGENT_NOTE_HEADERS)
    .find((row) => row.agent_id === context.telegramId && objectIdsEqual_(row.object_id, objectId)) : null;
  const comments = agentCommentRowsForClient_(
    sheetRowsAsObjects_(getAgentCommentsSheet_(), AGENT_COMMENT_HEADERS)
      .filter((row) => objectIdsEqual_(row.object_id, objectId)),
    context
  );
  const claim = agentContext.ok ? sheetRowsAsObjects_(getAgentClientsSheet_(), AGENT_CLIENT_HEADERS)
    .find((row) => (
      row.agent_id === context.telegramId
      && objectIdsEqual_(row.object_id, objectId)
      && row.status !== "released"
    )) : null;

  return {
    ok: true,
    role: agentContext.ok ? "approved" : "user",
    object: safeAgentCrmObject_(record),
    can_edit_object: ownsListingKey_(context, listingAgentIdForObject_(objectId, links)),
    can_moderate_object: context.isAdmin,
    note: note ? { note: note.note, updated_at: note.updated_at } : null,
    comments: comments,
    client_claim: claim ? {
      claim_id: claim.claim_id,
      client_label: claim.client_label,
      created_at: claim.created_at,
    } : null,
  };
}

function getUserObjects_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  return {
    ok: true,
    role: "user",
    user_name: context.name,
    objects: ownObjectRecords_(context)
      .map((record) => safeAgentCrmObject_(record))
      .filter((record) => record && cleanText_(record.deal).toLowerCase() !== "запрос"),
  };
}

function normalizedPhoneDigits_(value) {
  const digits = cleanText_(value).replace(/\D/g, "");
  if (digits.length === 10 && digits.charAt(0) === "0") return "996" + digits.slice(1);
  return digits;
}

function ownRequestRecords_(context, catalog, links) {
  const linkedIds = {};
  ownObjectIds_(context, links).forEach((id) => { linkedIds[normalizeObjectId_(id)] = true; });
  const phone = normalizedPhoneDigits_(context.phone);
  const inferredLinks = [];
  const records = requestRows_(catalog)
    .filter((record) => {
      const objectId = normalizeObjectId_(record.id);
      if (linkedIds[objectId]) return true;
      if (!phone || normalizedPhoneDigits_(record.phone) !== phone) return false;
      inferredLinks.push({ id: objectId, listing_agent_id: context.telegramId, poster_type: "клиент" });
      linkedIds[objectId] = true;
      return true;
    });
  upsertObjectAgentLinks_(inferredLinks, links);
  return records;
}

function safeUserRequest_(record) {
  if (!record) return null;
  return [
    "id", "rooms", "price", "title", "district", "status", "description",
    "phone", "contact_name", "created_at", "updated_at"
  ]
    .reduce((result, header) => {
      result[header] = cleanText_(record[header]);
      return result;
    }, {});
}

function getUserRequestsVerified_(payload) {
  const status = webSessionStatus_({
    auth_secret: payload.auth_secret,
    web_user_id: payload.web_user_id,
    email: payload.web_session_email,
  });
  if (!status.ok || status.authorized !== true) return { ok: false, error: "registration_required" };
  return getUserRequests_(payload);
}

function getUserRequests_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  return {
    ok: true,
    requests: ownRequestRecords_(context).map(safeUserRequest_).filter(Boolean),
  };
}

function updateUserRequest_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.request_id || payload.object_id);
  const catalog = catalogRows_();
  const links = objectAgentLinks_();
  const record = getObjectRecordById_(objectId, catalog);
  if (!record || cleanText_(record.deal).toLowerCase() !== "запрос") {
    return { ok: false, error: "request_not_found" };
  }
  ownRequestRecords_(context, catalog, links);
  if (!ownsListingKey_(context, listingAgentIdForObject_(objectId, links))) {
    return { ok: false, error: "request_edit_denied" };
  }
  const changes = payload.changes && typeof payload.changes === "object" ? payload.changes : {};
  const allowed = ["rooms", "price", "title", "district", "description", "phone", "contact_name"];
  const required = ["price", "title", "district", "phone", "contact_name"];
  const update = { id: objectId, updated_at: new Date().toISOString() };
  allowed.forEach((header) => {
    if (Object.prototype.hasOwnProperty.call(changes, header)) {
      const limit = header === "description" ? 700 : header === "phone" ? 40 : header === "contact_name" ? 120 : 240;
      update[header] = cleanText_(changes[header]).slice(0, limit);
    }
  });
  const nextRecord = Object.assign({}, record, update);
  const hasEditableChanges = allowed.some((header) => Object.prototype.hasOwnProperty.call(update, header));
  if (hasEditableChanges) {
    for (let index = 0; index < required.length; index += 1) {
      const header = required[index];
      if (!cleanText_(nextRecord[header])) {
        return { ok: false, error: "required_" + header };
      }
    }
    update.tg_link = requestWhatsappLinkForRecord_(nextRecord);
  }
  if (Object.prototype.hasOwnProperty.call(changes, "status")) {
    update.status = objectStatusValue_(changes.status);
  }
  upsertObjectFields_(update, REQUEST_EDIT_HEADERS, record);
  return { ok: true, request: safeUserRequest_(Object.assign({}, record, update)) };
}

function requestWhatsappLinkForRecord_(record) {
  const rawPhone = cleanText_(record && record.phone);
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.charAt(0) === "0") digits = "996" + digits.slice(1);
  if (!digits) return "";
  const title = cleanText_(record && record.title) || "Заявка на поиск";
  const district = cleanText_(record && record.district) || "не указан";
  const price = cleanText_(record && record.price) || "не указан";
  const text = [
    "Здравствуйте! Пишу по заявке с сайта Liberterra:",
    title,
    "Район: " + district,
    "Бюджет: " + price,
  ].join("\n");
  return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
}

function updateAgentObject_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  const catalog = catalogRows_();
  const links = objectAgentLinks_();
  const record = getObjectRecordById_(objectId, catalog);
  if (!record) return { ok: false, error: "object_not_found" };
  if (!ownsListingKey_(context, listingAgentIdForObject_(objectId, links))) {
    return { ok: false, error: "object_edit_denied" };
  }

  const changes = payload.changes && typeof payload.changes === "object" ? payload.changes : {};
  const allowed = ["price", "title", "district", "description", "rooms", "area", "floor", "photo_url", "latitude", "longitude"];
  if (Object.prototype.hasOwnProperty.call(changes,"photo_url")) {
    const photos = cleanText_(changes.photo_url).split(/\s*(?:\||\n)\s*/).filter(Boolean);
    if (!photos.length || photos.length > 5 || photos.some((url) => !/^https:\/\//i.test(url))) return {ok:false,error:"invalid_photo_count"};
  }
  const update = { id: objectId, updated_at: new Date().toISOString() };
  allowed.forEach((header) => {
    if (Object.prototype.hasOwnProperty.call(changes, header)) {
      update[header] = cleanText_(changes[header]).slice(0, header === "description" ? 700 : 240);
    }
  });
  if (allowed.some((header) => Object.prototype.hasOwnProperty.call(changes, header))) {
    update.status = "на модерации";
  }
  if (Object.prototype.hasOwnProperty.call(changes, "status")) {
    const nextStatus = objectStatusValue_(changes.status);
    if (objectId.indexOf("site-") === 0 && nextStatus === "опубликован" && !context.isAdmin) return {ok:false,error:"moderation_required"};
    const hasContract = PRIVATE_CONTRACT_HEADERS.slice(0, 4).some((header) => cleanText_(record[header]));
    if (nextStatus === "опубликован" && hasContract && !isTrue_(record.contract_signed)) {
      return { ok: false, error: "contract_not_verified" };
    }
    update.status = nextStatus;
  }
  if (Object.prototype.hasOwnProperty.call(changes, "actuality_at") || update.status === "опубликован") {
    update.actuality_at = new Date().toISOString();
  }

  upsertObjectFields_(update, AGENT_CRM_OBJECT_HEADERS, record);
  const updatedRecord = Object.assign({}, record, update);
  const response = { ok: true, object: safeAgentCrmObject_(updatedRecord) };
  if (update.status === "на модерации") {
    if (objectId.indexOf("site-") === 0) response.moderation_channel = "website";
    else response.notification_sent = notifyAdminAboutObjectRevision_(updatedRecord, context);
  }
  return response;
}

function deleteRowsForObject_(sheet, requiredHeaders, objectId) {
  const rows = sheetRowsAsObjects_(sheet, requiredHeaders)
    .filter((row) => objectIdsEqual_(row.object_id, objectId))
    .sort((left, right) => right._row - left._row);
  rows.forEach((row) => sheet.deleteRow(row._row));
  return rows.length;
}

function deleteUserObject_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    // Read the catalog and ownership links once. The previous implementation
    // scanned the same sheets repeatedly before and after acquiring the lock.
    const catalog = catalogRows_();
    const links = objectAgentLinks_();
    const currentLocation = findCatalogRecord_(objectId, catalog);
    const current = currentLocation && currentLocation.row;
    if (!current) return { ok: false, error: "object_not_found" };
    if (
      currentLocation.kind !== "object"
      || !ownsListingKey_(context, listingAgentIdForObject_(objectId, links))
    ) {
      return { ok: false, error: "object_delete_denied" };
    }

    const removed = {
      favorites: deleteRowsForObject_(getUserFavoritesSheet_(), USER_FAVORITE_HEADERS, objectId),
      links: deleteRowsForObject_(getObjectAgentLinksSheet_(), ["object_id", "listing_agent_id", "poster_type"], objectId),
      notes: deleteRowsForObject_(getAgentNotesSheet_(), AGENT_NOTE_HEADERS, objectId),
      comments: deleteRowsForObject_(getAgentCommentsSheet_(), AGENT_COMMENT_HEADERS, objectId),
      clients: deleteRowsForObject_(getAgentClientsSheet_(), AGENT_CLIENT_HEADERS, objectId),
      reports: deleteRowsForObject_(getCommentReportsSheet_(), COMMENT_REPORT_HEADERS, objectId),
    };
    currentLocation.sheet.deleteRow(currentLocation.row._row);
    const legacy = getLegacyCombinedSheet_();
    if (legacy) {
      const legacyHeaders = ensureHeaders_(legacy, OBJECT_HEADERS);
      const legacyRow = findValueRow_(legacy, legacyHeaders.id, objectId);
      if (legacyRow) legacy.deleteRow(legacyRow);
    }
    syncPublicCatalogSnapshotToD1_();
    return { ok: true, deleted: true, object_id: objectId, related_rows_deleted: removed };
  } finally {
    lock.releaseLock();
  }
}

function saveAgentNote_(payload) {
  const context = payload.web_user_id ? agentPrivateContext_(payload) : approvedAgentContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  const record = getObjectRecordById_(objectId);
  if (!approvedCanAccessObject_(context, record)) {
    return { ok: false, error: record ? "object_access_denied" : "object_not_found" };
  }
  const note = cleanText_(payload.note).slice(0, 3000);
  const sheet = getAgentNotesSheet_();
  const headerMap = ensureHeaders_(sheet, AGENT_NOTE_HEADERS);
  const rows = sheetRowsAsObjects_(sheet, AGENT_NOTE_HEADERS);
  const existing = rows.find((row) => row.agent_id === context.telegramId && objectIdsEqual_(row.object_id, objectId));
  const rowNumber = existing ? existing._row : Math.max(sheet.getLastRow() + 1, 2);
  const updatedAt = new Date();
  sheet.getRange(rowNumber, 1, 1, AGENT_NOTE_HEADERS.length).setValues([[
    safeSheetValue_(context.telegramId),
    safeSheetValue_(objectId),
    safeSheetValue_(note),
    updatedAt,
  ]]);
  return { ok: true, note: { note: note, updated_at: updatedAt.toISOString() } };
}

function addAgentComment_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  const record = getObjectRecordById_(objectId);
  if (!approvedCanAccessObject_(context, record)) {
    return { ok: false, error: record ? "object_access_denied" : "object_not_found" };
  }
  const text = cleanText_(payload.text);
  if (!text) return { ok: false, error: "comment_required" };
  if (text.length > MAX_AGENT_COMMENT_LENGTH) {
    return { ok: false, error: "comment_too_long" };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return { ok: false, error: "comment_rate_limited" };
  }
  let savedComment = null;
  try {
    const sheet = getAgentCommentsSheet_();
    const rows = sheetRowsAsObjects_(sheet, AGENT_COMMENT_HEADERS);
    const now = new Date();
    if (!agentCommentRateAllowed_(rows, context.telegramId, now.getTime())) {
      return { ok: false, error: "comment_rate_limited" };
    }
    const commentId = Utilities.getUuid();
    sheet.appendRow([
      safeSheetValue_(commentId),
      safeSheetValue_(objectId),
      safeSheetValue_(context.telegramId),
      safeSheetValue_(context.name),
      safeSheetValue_(text),
      now,
      false,
    ]);
    savedComment = {
      ok: true,
      comment: {
        comment_id: commentId,
        agent_name: context.name,
        text: text,
        created_at: now.toISOString(),
        edited: false,
        can_edit: true,
        can_delete: true,
      },
    };
  } finally {
    lock.releaseLock();
  }
  savedComment.notification_sent = notifyObjectOwnerAboutComment_(record, context, text);
  return savedComment;
}

function updateAgentComment_(payload) {
  return mutateAgentComment_(payload, false);
}

function deleteAgentComment_(payload) {
  return mutateAgentComment_(payload, true);
}

function reportComment_(payload) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const commentId = cleanText_(payload.comment_id);
  const comment = sheetRowsAsObjects_(getAgentCommentsSheet_(), AGENT_COMMENT_HEADERS)
    .find((row) => cleanText_(row.comment_id) === commentId);
  if (!comment) return { ok: false, error: "comment_not_found" };
  const sheet = getCommentReportsSheet_();
  const existing = sheetRowsAsObjects_(sheet, COMMENT_REPORT_HEADERS)
    .some((row) => row.comment_id === commentId && row.reporter_id === context.telegramId);
  if (existing) return { ok: true, reported: true };
  sheet.appendRow([Utilities.getUuid(), safeSheetValue_(commentId), safeSheetValue_(comment.object_id), safeSheetValue_(context.telegramId), new Date(), "новая"]);
  return { ok: true, reported: true };
}

function mutateAgentComment_(payload, remove) {
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const commentId = cleanText_(payload.comment_id);
  const sheet = getAgentCommentsSheet_();
  const headerMap = ensureHeaders_(sheet, AGENT_COMMENT_HEADERS);
  const comment = sheetRowsAsObjects_(sheet, AGENT_COMMENT_HEADERS)
    .find((row) => cleanText_(row.comment_id) === commentId);
  if (!comment) return { ok: false, error: "comment_not_found" };
  const isOwner = cleanText_(comment.agent_id) === cleanText_(context.telegramId);
  if (remove) {
    if (!context.isAdmin && !isOwner) {
      return { ok: false, error: "comment_manage_denied" };
    }
    sheet.deleteRow(comment._row);
    return { ok: true, deleted: true };
  }
  if (!isOwner) {
    return { ok: false, error: "comment_manage_denied" };
  }
  const text = cleanText_(payload.text);
  if (!text) return { ok: false, error: "comment_required" };
  if (text.length > MAX_AGENT_COMMENT_LENGTH) {
    return { ok: false, error: "comment_too_long" };
  }
  sheet.getRange(comment._row, headerMap.text).setValue(safeSheetValue_(text));
  sheet.getRange(comment._row, headerMap.edited).setValue(true);
  return { ok: true, comment: { comment_id: commentId, text: text, edited: true } };
}

function agentCommentRowsForClient_(rows, context) {
  return rows
    .map((row) => {
      const isOwner = cleanText_(row.agent_id) === cleanText_(context.telegramId);
      return {
        comment_id: row.comment_id,
        agent_name: row.agent_name,
        text: row.text,
        created_at: row.created_at,
        edited: isTrue_(row.edited),
        can_edit: isOwner,
        can_delete: isOwner || context.isAdmin,
      };
    })
    .sort((left, right) => (
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    ));
}

function agentCommentRateAllowed_(rows, agentId, nowMs) {
  const recentCount = rows.filter((row) => {
    if (cleanText_(row.agent_id) !== cleanText_(agentId)) return false;
    const createdAt = new Date(row.created_at).getTime();
    return (
      Number.isFinite(createdAt)
      && nowMs - createdAt >= 0
      && nowMs - createdAt < AGENT_COMMENT_RATE_WINDOW_MS
    );
  }).length;
  return recentCount < AGENT_COMMENT_RATE_LIMIT;
}

function cleanClientLabel_(value) {
  const label = cleanText_(value).slice(0, 80);
  if (
    /https?:\/\/|www\.|@|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\d{7,}/i.test(label)
  ) {
    return "";
  }
  return label;
}

function claimAgentClient_(payload) {
  const context = payload.web_user_id ? agentPrivateContext_(payload) : approvedAgentContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  const record = getObjectRecordById_(objectId);
  if (!approvedCanAccessObject_(context, record)) {
    return { ok: false, error: record ? "object_access_denied" : "object_not_found" };
  }
  const rawLabel = cleanText_(payload.client_label);
  const clientLabel = cleanClientLabel_(rawLabel);
  if (rawLabel && !clientLabel) return { ok: false, error: "client_label_contacts_not_allowed" };
  const sheet = getAgentClientsSheet_();
  const rows = sheetRowsAsObjects_(sheet, AGENT_CLIENT_HEADERS);
  const existing = rows.find((row) => (
    row.agent_id === context.telegramId
    && objectIdsEqual_(row.object_id, objectId)
    && row.status !== "released"
  ));
  if (existing) {
    return {
      ok: true,
      claim: {
        claim_id: existing.claim_id,
        client_label: existing.client_label,
        created_at: existing.created_at,
      },
    };
  }
  const claimId = Utilities.getUuid();
  const now = new Date();
  sheet.appendRow([
    safeSheetValue_(claimId),
    safeSheetValue_(context.telegramId),
    safeSheetValue_(context.name),
    safeSheetValue_(objectId),
    safeSheetValue_(clientLabel),
    now,
    "active",
  ]);
  return {
    ok: true,
    claim: { claim_id: claimId, client_label: clientLabel, created_at: now.toISOString() },
  };
}

function releaseAgentClient_(payload) {
  const context = payload.web_user_id ? agentPrivateContext_(payload) : approvedAgentContext_(payload);
  if (!context.ok) return context;
  const claimId = cleanText_(payload.claim_id);
  const sheet = getAgentClientsSheet_();
  const headerMap = ensureHeaders_(sheet, AGENT_CLIENT_HEADERS);
  const claim = sheetRowsAsObjects_(sheet, AGENT_CLIENT_HEADERS)
    .find((row) => row.claim_id === claimId && row.agent_id === context.telegramId);
  if (!claim) return { ok: false, error: "claim_not_found" };
  sheet.getRange(claim._row, headerMap.status).setValue("released");
  return { ok: true, released: true };
}

function getPublicObjectAgent_(payload) {
  const objectId = cleanText_(payload.object_id);
  const catalog = catalogRows_();
  const links = objectAgentLinks_();
  const record = getObjectRecordById_(objectId, catalog);
  if (!isPublicCrmObject_(record)) return { ok: false, error: "object_not_public" };
  if (cleanText_(record.deal).toLowerCase() === "запрос") return { ok: true, agent: null };
  const link = links.find((row) => objectIdsEqual_(row.object_id, objectId));
  if (!link || cleanText_(link.poster_type).toLowerCase() !== "агент") return { ok: true, agent: null };
  const agent = agentRecordById_(link.listing_agent_id);
  if (!agent || agent.role !== "approved") return { ok: true, agent: null };
  return {
    ok: true,
    agent: {
      avatar_url: agent.avatar_url || "",
      name: agent.name,
      agency: agent.agency,
      phone: cleanText_(record.contact_privacy_mode) === "agent_private_v1" && isValidWorkPhone_(agent.phone) ? cleanText_(agent.phone) : "",
      specialization: agent.specialization,
      rating: agent.rating,
      experience: agent.experience,
      active_object_count: ownObjectRecords_(agent.telegram_id, catalog, links)
        .filter((item) => isPublicCrmObject_(item) && cleanText_(item.deal).toLowerCase() !== "запрос").length,
      public_ref: publicAgentRef_(agent.telegram_id),
    },
  };
}

function getPublicAgentObjects_(payload) {
  const started = Date.now();
  const agent = agentByPublicRef_(payload.agent_ref);
  if (!agent) return { ok: false, error: "agent_not_found" };
  const agentRead = Date.now();
  const catalog = catalogRows_(true);
  const catalogRead = Date.now();
  const links = objectAgentLinks_(true);
  const linksRead = Date.now();
  const objects = ownObjectRecords_(agent.telegram_id, catalog, links)
    .filter((record) => isPublicCrmObject_(record) && cleanText_(record.deal).toLowerCase() !== "запрос")
    .map((record) => safeAgentCrmObject_(record));
  // Timings only: never log tokens, identities, contacts or catalog contents.
  console.info(JSON.stringify({ event: "public_agent_profile_timing", agent_ms: agentRead - started,
    catalog_ms: catalogRead - agentRead, links_ms: linksRead - catalogRead, total_ms: Date.now() - started }));
  return {
    ok: true,
    agent: {
      avatar_url: agent.avatar_url || "",
      name: agent.name,
      agency: agent.agency,
      specialization: agent.specialization,
      rating: agent.rating,
      experience: agent.experience,
      active_object_count: objects.length,
      public_ref: agent.public_ref,
      registry: publicAgentRegistry_(agentRegistryRecords_()[agent.telegram_id]),
    },
    objects: objects,
  };
}

function normalizeAgentRating_(value) {
  const numeric = Number(String(value || "").replace(",", "."));
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) return "";
  return numeric.toFixed(1);
}

function validateTelegramInitData_(initData, claimedTelegramId) {
  const rawInitData = cleanText_(initData);
  const claimedId = cleanText_(claimedTelegramId);
  const botToken = PropertiesService.getScriptProperties().getProperty("BOT_TOKEN");
  if (!rawInitData || !claimedId || !botToken) {
    return { ok: false };
  }

  const fields = parseQueryString_(rawInitData);
  const receivedHash = cleanText_(fields.hash).toLowerCase();
  if (!receivedHash || !fields.auth_date || !fields.user) {
    return { ok: false };
  }

  const dataCheckString = Object.keys(fields)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => key + "=" + fields[key])
    .join("\n");

  const secretKey = Utilities.computeHmacSha256Signature(
    botToken,
    "WebAppData",
    Utilities.Charset.UTF_8
  );
  const dataCheckBytes = Utilities.newBlob(dataCheckString, "text/plain").getBytes();
  const calculatedHash = bytesToHex_(
    Utilities.computeHmacSha256Signature(dataCheckBytes, secretKey)
  );
  if (!constantTimeEqual_(receivedHash, calculatedHash)) {
    return { ok: false };
  }

  const authDate = Number(fields.auth_date);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate > now + 300 || now - authDate > MAX_INIT_DATA_AGE_SECONDS) {
    return { ok: false };
  }

  let user;
  try {
    user = JSON.parse(fields.user);
  } catch (error) {
    return { ok: false };
  }

  const telegramId = cleanText_(user && user.id);
  if (!telegramId || telegramId !== claimedId) {
    return { ok: false };
  }

  return { ok: true, user: user, telegramId: telegramId };
}

function saveAgentDocumentPhoto_(payload, telegramId) {
  const encoded = cleanText_(payload.document_photo_base64);
  if (!encoded) {
    return "";
  }

  const mimeType = cleanText_(payload.document_photo_type).toLowerCase();
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.indexOf(mimeType) === -1) {
    throw new Error("unsupported_document_photo_type");
  }

  const bytes = Utilities.base64Decode(encoded);
  if (bytes.length > MAX_DOCUMENT_PHOTO_BYTES) {
    throw new Error("document_photo_too_large");
  }

  const extensionByType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const originalName = sanitizeFileName_(payload.document_photo_name || "document");
  const fileName = "agent_" + telegramId + "_" + Date.now() + "_" + originalName.replace(/\.[^.]+$/, "") + "." + extensionByType[mimeType];
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  return getAgentDocumentsFolder_().createFile(blob).getUrl();
}

function getAgentDocumentsFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const savedFolderId = properties.getProperty("AGENT_DOCUMENTS_FOLDER_ID");
  if (savedFolderId) {
    try {
      return DriveApp.getFolderById(savedFolderId);
    } catch (error) {
      console.warn("Saved agent document folder is unavailable; creating a new one.");
    }
  }

  const matchingFolders = DriveApp.getFoldersByName(AGENT_DOCUMENTS_FOLDER_NAME);
  const folder = matchingFolders.hasNext()
    ? matchingFolders.next()
    : DriveApp.createFolder(AGENT_DOCUMENTS_FOLDER_NAME);
  properties.setProperty("AGENT_DOCUMENTS_FOLDER_ID", folder.getId());
  return folder;
}

function getOwnerContractsFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const savedFolderId = properties.getProperty("OWNER_CONTRACTS_FOLDER_ID");
  if (savedFolderId) {
    try {
      return DriveApp.getFolderById(savedFolderId);
    } catch (error) {
      console.warn("Saved owner contracts folder is unavailable; creating a new one.");
    }
  }

  const matchingFolders = DriveApp.getFoldersByName(OWNER_CONTRACTS_FOLDER_NAME);
  const folder = matchingFolders.hasNext()
    ? matchingFolders.next()
    : DriveApp.createFolder(OWNER_CONTRACTS_FOLDER_NAME);
  properties.setProperty("OWNER_CONTRACTS_FOLDER_ID", folder.getId());
  return folder;
}

function notifyAdminAboutAgent_(agent) {
  const properties = PropertiesService.getScriptProperties();
  const botToken = properties.getProperty("BOT_TOKEN");
  const adminChatId = properties.getProperty("ADMIN_CHAT_ID");
  if (!botToken || !adminChatId) {
    return false;
  }

  const username = agent.username ? "@" + agent.username : "не указан";
  const text = [
    "Новая заявка агента",
    "Имя: " + agent.fullName,
    "Агентство: " + agent.agency,
    "Направление: " + agent.specialization,
    "Телефон: " + agent.phone,
    "Username: " + username,
    "Telegram ID: " + agent.telegramId,
    "",
    "Одобрить? Откройте лист «Агенты» и измените статус на «одобрен».",
  ].join("\n");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const spreadsheetUrl = spreadsheet.getUrl() + "#gid=" + getAgentsSheet_().getSheetId();
  try {
    const response = UrlFetchApp.fetch(
      "https://api.telegram.org/bot" + botToken + "/sendMessage",
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          chat_id: adminChatId,
          text: text,
          reply_markup: {
            inline_keyboard: [[{ text: "Открыть лист «Агенты»", url: spreadsheetUrl }]],
          },
        }),
        muteHttpExceptions: true,
      }
    );
    const responseCode = response.getResponseCode();
    if (responseCode < 200 || responseCode >= 300) {
      console.error("Admin notification failed (HTTP " + responseCode + "): " + response.getContentText());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Admin notification failed: " + error);
    return false;
  }
}

function notifyObjectOwnerAboutComment_(record, commenter, commentText) {
  const ownerTelegramId = listingAgentIdForObject_(record && record.id);
  if (!ownerTelegramId || ownerTelegramId === cleanText_(commenter.telegramId)) {
    return false;
  }

  const botToken = cleanText_(PropertiesService.getScriptProperties().getProperty("BOT_TOKEN"));
  if (!botToken) return false;

  const objectId = normalizeObjectId_(record.id);
  const objectTitle = cleanText_(record.title) || ("Объект №" + objectId);
  const preview = cleanText_(commentText).slice(0, 350);
  const baseUrl = cleanText_(
    PropertiesService.getScriptProperties().getProperty("CATALOG_BASE_URL")
  ).replace(/\/$/, "") || "https://hidden-pine-cbff.mirbekbekov.workers.dev";
  const objectUrl = baseUrl + "/object.html?id=" + encodeURIComponent(objectId);
  const message = [
    "Новый комментарий к вашему объявлению",
    "",
    objectTitle,
    "Автор: " + (cleanText_(commenter.name) || "Пользователь Liberterra"),
    "",
    preview,
  ].join("\n");

  try {
    const response = UrlFetchApp.fetch(
      "https://api.telegram.org/bot" + botToken + "/sendMessage",
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          chat_id: ownerTelegramId,
          text: message,
          reply_markup: {
            inline_keyboard: [[{
              text: "Открыть объявление",
              web_app: { url: objectUrl },
            }]],
          },
        }),
        muteHttpExceptions: true,
      }
    );
    const responseCode = response.getResponseCode();
    if (responseCode < 200 || responseCode >= 300) {
      console.error("Object comment notification failed (HTTP " + responseCode + "): " + response.getContentText());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Object comment notification failed: " + error);
    return false;
  }
}

function notifyAdminAboutObjectRevision_(record, editor) {
  const properties = PropertiesService.getScriptProperties();
  const botToken = cleanText_(properties.getProperty("BOT_TOKEN"));
  const adminChatId = cleanText_(properties.getProperty("ADMIN_CHAT_ID"));
  if (!botToken || !adminChatId || !record) return false;

  const objectId = normalizeObjectId_(record.id);
  const objectTitle = cleanText_(record.title) || ("Объект №" + objectId);
  const baseUrl = cleanText_(properties.getProperty("CATALOG_BASE_URL"))
    .replace(/\/$/, "") || "https://hidden-pine-cbff.mirbekbekov.workers.dev";
  const objectUrl = baseUrl + "/object.html?id=" + encodeURIComponent(objectId);
  const text = [
    "✏️ Объект изменён и ждёт повторной проверки",
    "",
    "Объект №" + objectId + ": " + objectTitle,
    "Автор: " + (cleanText_(editor.name) || "Пользователь Liberterra"),
    "Район: " + (cleanText_(record.district) || "не указан"),
    "Цена: " + (cleanText_(record.price) || "не указана"),
  ].join("\n");

  try {
    const telegramResponse = UrlFetchApp.fetch(
      "https://api.telegram.org/bot" + botToken + "/sendMessage",
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          chat_id: adminChatId,
          text: text,
          reply_markup: {
            inline_keyboard: [[{
              text: "Открыть объявление",
              web_app: { url: objectUrl },
            }]],
          },
        }),
        muteHttpExceptions: true,
      }
    );
    const responseCode = telegramResponse.getResponseCode();
    if (responseCode < 200 || responseCode >= 300) {
      console.error("Object revision notification failed (HTTP " + responseCode + "): " + telegramResponse.getContentText());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Object revision notification failed: " + error);
    return false;
  }
}

function sendPendingAgentsToAdmin() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty("BOT_TOKEN")) {
    throw new Error("Добавьте BOT_TOKEN в свойства скрипта.");
  }
  if (!properties.getProperty("ADMIN_CHAT_ID")) {
    throw new Error("Добавьте ADMIN_CHAT_ID в свойства скрипта.");
  }

  const sheet = getAgentsSheet_();
  const headerMap = ensureHeaders_(sheet, AGENT_HEADERS);
  if (sheet.getLastRow() < 2) {
    return "Заявок на проверке нет";
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
  let sent = 0;
  rows.forEach((row) => {
    if (roleFromStatus_(row[headerMap["Статус"] - 1]) !== "pending") {
      return;
    }

    if (notifyAdminAboutAgent_({
      telegramId: cleanText_(row[headerMap.telegram_id - 1]),
      fullName: cleanText_(row[headerMap["Имя"] - 1]) || "Не указано",
      agency: cleanText_(row[headerMap["Агентство"] - 1]) || "Не указано",
      specialization: agentSpecializationLabel_(row[headerMap["Направление"] - 1]),
      phone: cleanText_(row[headerMap["Телефон"] - 1]) || "Не указан",
      username: normalizeUsername_(row[headerMap.Username - 1]),
    })) {
      sent += 1;
    }
  });

  if (!sent) {
    throw new Error("Заявки найдены, но Telegram не принял уведомление. Проверьте BOT_TOKEN, ADMIN_CHAT_ID и отправьте боту /start.");
  }
  return "Отправлено заявок администратору: " + sent;
}

function getObjectsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(OBJECTS_SHEET_NAME) || spreadsheet.insertSheet(OBJECTS_SHEET_NAME);
}

function getRequestsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(REQUESTS_SHEET_NAME) || spreadsheet.insertSheet(REQUESTS_SHEET_NAME);
}

function getLegacyCombinedSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEGACY_COMBINED_SHEET_NAME);
}

function catalogRowsFromSheet_(sheet, kind, readOnly) {
  if (!sheet) return [];
  const rows = readOnly ? readPublicSheetRows_(sheet, OBJECT_HEADERS) : sheetRowsAsObjects_(sheet, OBJECT_HEADERS);
  return rows.map((row) => {
    row._sheet = sheet;
    row._kind = kind;
    return row;
  });
}

function catalogRows_(readOnly) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const objectSheet = spreadsheet.getSheetByName(OBJECTS_SHEET_NAME);
  const requestSheet = spreadsheet.getSheetByName(REQUESTS_SHEET_NAME);
  const merged = {};
  catalogRowsFromSheet_(getLegacyCombinedSheet_(), "legacy", readOnly)
    .concat(catalogRowsFromSheet_(objectSheet, "object", readOnly))
    .concat(catalogRowsFromSheet_(requestSheet, "request", readOnly))
    .forEach((row) => {
      const id = normalizeObjectId_(row.id);
      if (id) merged[id] = row;
    });
  return Object.keys(merged).map((id) => merged[id]);
}

function objectRows_(catalog) {
  return (catalog || catalogRows_()).filter((row) => cleanText_(row.deal).toLowerCase() !== "запрос");
}

function requestRows_(catalog) {
  return (catalog || catalogRows_()).filter((row) => cleanText_(row.deal).toLowerCase() === "запрос");
}

function findCatalogRecord_(objectId, catalog) {
  const id = normalizeObjectId_(objectId);
  if (!id) return null;
  const record = (catalog || catalogRows_()).find((row) => objectIdsEqual_(row.id, id));
  if (!record) return null;
  return {
    sheet: record._sheet,
    row: record,
    kind: cleanText_(record.deal).toLowerCase() === "запрос" ? "request" : "object",
  };
}

function getAgentsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(AGENTS_SHEET_NAME) || spreadsheet.insertSheet(AGENTS_SHEET_NAME);
}

function getUsersSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(USERS_SHEET_NAME) || spreadsheet.insertSheet(USERS_SHEET_NAME);
}

function getUserFavoritesSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(USER_FAVORITES_SHEET_NAME) || spreadsheet.insertSheet(USER_FAVORITES_SHEET_NAME);
  ensureHeaders_(sheet, USER_FAVORITE_HEADERS);
  return sheet;
}

function getObjectAgentLinksSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(OBJECT_AGENT_LINKS_SHEET_NAME) || spreadsheet.insertSheet(OBJECT_AGENT_LINKS_SHEET_NAME);
}

function getAgentNotesSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(AGENT_NOTES_SHEET_NAME) || spreadsheet.insertSheet(AGENT_NOTES_SHEET_NAME);
}

function getAgentCommentsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(AGENT_COMMENTS_SHEET_NAME)
    || spreadsheet.insertSheet(AGENT_COMMENTS_SHEET_NAME);
  ensureHeaders_(sheet, AGENT_COMMENT_HEADERS);
  migrateLegacyAgentComments_(spreadsheet, sheet);
  return sheet;
}

function migrateLegacyAgentComments_(spreadsheet, targetSheet) {
  if (targetSheet.getLastRow() > 1) return;
  const legacySheet = spreadsheet.getSheetByName(LEGACY_AGENT_COMMENTS_SHEET_NAME);
  if (!legacySheet || legacySheet === targetSheet || legacySheet.getLastRow() < 2) return;

  const rows = sheetRowsAsObjects_(legacySheet, LEGACY_AGENT_COMMENT_HEADERS)
    .filter((row) => !isTrue_(row.deleted))
    .map((row) => [
      safeSheetValue_(row.comment_id),
      safeSheetValue_(row.object_id),
      safeSheetValue_(row.author_agent_id),
      safeSheetValue_(row.author_name),
      safeSheetValue_(row.text),
      row.created_at,
      agentCommentWasEdited_(row),
    ]);
  if (rows.length) {
    targetSheet.getRange(2, 1, rows.length, AGENT_COMMENT_HEADERS.length).setValues(rows);
  }
}

function agentCommentWasEdited_(row) {
  const createdAt = new Date(row.created_at).getTime();
  const updatedAt = new Date(row.updated_at).getTime();
  return Number.isFinite(createdAt) && Number.isFinite(updatedAt) && updatedAt > createdAt;
}

function getAgentClientsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(AGENT_CLIENTS_SHEET_NAME) || spreadsheet.insertSheet(AGENT_CLIENTS_SHEET_NAME);
}

function getCommentReportsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(COMMENT_REPORTS_SHEET_NAME) || spreadsheet.insertSheet(COMMENT_REPORTS_SHEET_NAME);
  ensureHeaders_(sheet, COMMENT_REPORT_HEADERS);
  return sheet;
}

function getVisitsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(VISITS_SHEET_NAME) || spreadsheet.insertSheet(VISITS_SHEET_NAME);
}

function getAnalyticsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(ANALYTICS_SHEET_NAME) || spreadsheet.insertSheet(ANALYTICS_SHEET_NAME);
}

function getUserActivitySheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(USER_ACTIVITY_SHEET_NAME) || spreadsheet.insertSheet(USER_ACTIVITY_SHEET_NAME);
}

function getModerationSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(MODERATION_SHEET_NAME) || spreadsheet.insertSheet(MODERATION_SHEET_NAME);
}

function getModerationActionsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(MODERATION_ACTIONS_SHEET_NAME)
    || spreadsheet.insertSheet(MODERATION_ACTIONS_SHEET_NAME);
  ensureHeaders_(sheet, MODERATION_ACTION_HEADERS);
  return sheet;
}

function ensureAnalyticsDashboard_() {
  const visitsSheet = getVisitsSheet_();
  ensureHeaders_(visitsSheet, VISIT_HEADERS);
  visitsSheet.setFrozenRows(1);
  visitsSheet.getRange(1, 1, 1, VISIT_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#16120E")
    .setFontColor("#FFFFFF");
  try {
    visitsSheet.getRange("A:A").setNumberFormat("dd.MM.yyyy HH:mm:ss");
  } catch (error) {
    console.warn("Не удалось применить формат даты к листу посещений: " + error.message);
  }

  return renderAdminDashboardSheet_();
}

function buildGoogleSheetsDashboardData_() {
  const now = new Date();
  const todayKey = dashboardDayKey_(now);
  const dayKeys = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    dayKeys.push(dashboardDayKey_(new Date(now.getTime() - offset * 24 * 60 * 60 * 1000)));
  }
  const daySet = {};
  const dailyMap = {};
  dayKeys.forEach((key) => {
    daySet[key] = true;
    dailyMap[key] = {
      date: key,
      sessions: {},
      page_views: 0,
      registrations: 0,
      actions: 0,
      listings: 0,
      requests: 0,
    };
  });

  const users = sheetRowsAsObjects_(getUsersSheet_(), USER_HEADERS)
    .filter((row) => cleanText_(row["Статус"]).toLowerCase() === "активен");
  const agents = sheetRowsAsObjects_(getAgentsSheet_(), AGENT_HEADERS);
  const objects = catalogRows_();
  const visits = sheetRowsAsObjects_(getVisitsSheet_(), VISIT_HEADERS);
  const links = objectAgentLinks_();
  const pageTotals = {};
  const listingAgentByObject = {};
  links.forEach((link) => {
    const objectId = normalizeObjectId_(link.object_id);
    const telegramId = cleanText_(link.listing_agent_id);
    if (objectId && telegramId) listingAgentByObject[objectId] = telegramId;
  });

  users.forEach((row) => {
    const key = dashboardDayKey_(dashboardDate_(row["Дата регистрации"]));
    if (daySet[key]) dailyMap[key].registrations += 1;
  });

  visits.forEach((row, index) => {
    const key = dashboardDayKey_(dashboardDate_(row["Дата"]));
    if (!daySet[key]) return;
    const eventName = cleanText_(row["Событие"]).toLowerCase() || "page_view";
    if (eventName === "page_view") {
      const session = cleanText_(row["Сессия"])
        || cleanText_(row["Посетитель"])
        || ("visit-" + index);
      dailyMap[key].sessions[session] = true;
      dailyMap[key].page_views += 1;
      const page = cleanText_(row["Страница"]) || cleanText_(row["Путь"]) || "Неизвестная страница";
      pageTotals[page] = (pageTotals[page] || 0) + 1;
    } else {
      dailyMap[key].actions += 1;
    }
  });

  objects.forEach((row) => {
    const key = dashboardDayKey_(dashboardDate_(row.created_at));
    if (!daySet[key]) return;
    if (cleanText_(row.deal).toLowerCase() === "запрос") {
      dailyMap[key].requests += 1;
    } else {
      dailyMap[key].listings += 1;
    }
  });

  const objectsById = {};
  objects.forEach((row) => {
    objectsById[normalizeObjectId_(row.id)] = row;
  });
  const publicationsByUser = {};
  links.forEach((link) => {
    const telegramId = cleanText_(link.listing_agent_id);
    const record = objectsById[normalizeObjectId_(link.object_id)];
    if (!telegramId || !record) return;
    if (!publicationsByUser[telegramId]) {
      publicationsByUser[telegramId] = { listings: 0, requests: 0, last_publication: "" };
    }
    const activity = publicationsByUser[telegramId];
    if (cleanText_(record.deal).toLowerCase() === "запрос") activity.requests += 1;
    else activity.listings += 1;
    const createdAt = sheetDateToIso_(record.created_at || record.updated_at);
    const currentTime = (dashboardDate_(activity.last_publication) || new Date(0)).getTime();
    const createdTime = (dashboardDate_(createdAt) || new Date(0)).getTime();
    if (createdTime > currentTime) activity.last_publication = createdAt;
  });

  const daily = dayKeys.map((key) => ({
    date: key,
    visits: Object.keys(dailyMap[key].sessions).length,
    page_views: dailyMap[key].page_views,
    registrations: dailyMap[key].registrations,
    actions: dailyMap[key].actions,
    listings: dailyMap[key].listings,
    requests: dailyMap[key].requests,
  }));
  const today = daily.find((row) => row.date === todayKey) || {};
  const last7 = daily.slice(-7);
  const sum7 = (field) => last7.reduce((sum, row) => sum + Number(row[field] || 0), 0);

  let activeListings = 0;
  let activeRequests = 0;
  objects.forEach((row) => {
    const isRequest = cleanText_(row.deal).toLowerCase() === "запрос";
    const status = normalizedObjectStatus_(row.status);
    if (isRequest && status === "active") activeRequests += 1;
    if (!isRequest && status === "active") activeListings += 1;
  });

  const catalogBaseUrl = cleanText_(
    PropertiesService.getScriptProperties().getProperty("CATALOG_BASE_URL")
  ).replace(/\/$/, "") || "https://hidden-pine-cbff.mirbekbekov.workers.dev";
  const moderationItems = objects
    .filter((row) => (
      cleanText_(row.deal).toLowerCase() !== "запрос"
      && normalizedObjectStatus_(row.status) === "moderation"
    ))
    .map((row) => {
      const objectId = normalizeObjectId_(row.id);
      const rawStatus = cleanText_(row.status);
      const comparableStatus = rawStatus.toLowerCase().replace(/ё/g, "е");
      const explicitModerationStatuses = ["на модерации", "pending", "moderation", "проверка"];
      return {
        id: objectId,
        status: rawStatus,
        moderation_reason: !rawStatus
          ? "Статус не указан — требуется проверка"
          : explicitModerationStatuses.indexOf(comparableStatus) !== -1
            ? "Ожидает проверки"
            : "Неизвестный статус — требуется проверка",
        title: cleanText_(row.title) || cleanText_(row.segment) || "Объект недвижимости",
        deal: cleanText_(row.deal),
        district: cleanText_(row.district),
        price: cleanText_(row.price),
        per: cleanText_(row.per),
        rooms: cleanText_(row.rooms),
        area: cleanText_(row.area),
        contact_name: cleanText_(row.contact_name),
        phone: cleanText_(row.phone),
        telegram_id: cleanText_(listingAgentByObject[objectId]),
        created_at: sheetDateToIso_(row.created_at),
        updated_at: sheetDateToIso_(row.updated_at),
        photo_url: cleanText_(row.photo_url).split("|")[0].trim(),
        object_url: objectId ? catalogBaseUrl + "/object.html?id=" + encodeURIComponent(objectId) : "",
      };
    })
    .sort((left, right) => (
      (dashboardDate_(right.updated_at || right.created_at) || new Date(0)).getTime()
      - (dashboardDate_(left.updated_at || left.created_at) || new Date(0)).getTime()
    ));

  const topPages = Object.keys(pageTotals)
    .map((page) => ({ page: page, visits: pageTotals[page] }))
    .sort((left, right) => right.visits - left.visits)
    .slice(0, 10);
  const userActivity = users
    .map((row) => ({
      telegram_id: cleanText_(row.telegram_id),
      name: cleanText_(row["Имя"]) || "Пользователь Liberterra",
      account_type: cleanText_(row["Тип"]) || "Пользователь",
      username: cleanText_(row.Username).replace(/^@/, ""),
      phone: cleanText_(row["Телефон"]),
      registered_at: sheetDateToIso_(row["Дата регистрации"]),
      last_seen_at: sheetDateToIso_(row["Последний вход"]),
      visits: Number(row["Посещений"] || 0),
      listings: Number((publicationsByUser[cleanText_(row.telegram_id)] || {}).listings || 0),
      requests: Number((publicationsByUser[cleanText_(row.telegram_id)] || {}).requests || 0),
      last_publication: cleanText_((publicationsByUser[cleanText_(row.telegram_id)] || {}).last_publication),
    }))
    .sort((left, right) => (
      (dashboardDate_(right.registered_at) || new Date(0)).getTime()
      - (dashboardDate_(left.registered_at) || new Date(0)).getTime()
    ));
  const recentUsers = userActivity.slice(0, 15);

  return {
    metrics: {
      visits_today: Number(today.visits || 0),
      registrations_today: Number(today.registrations || 0),
      actions_today: Number(today.actions || 0),
      listings_today: Number(today.listings || 0),
      visits_7d: sum7("visits"),
      registrations_7d: sum7("registrations"),
      active_requests: activeRequests,
      requests_today: Number(today.requests || 0),
      registered_users: users.length,
      approved_agents: agents.filter((row) => roleFromStatus_(row["Статус"]) === "approved").length,
      active_listings: activeListings,
      moderation_listings: moderationItems.length,
    },
    daily: daily,
    top_pages: topPages,
    recent_users: recentUsers,
    user_activity: userActivity,
    moderation_items: moderationItems,
  };
}

function renderAdminDashboardSheet_() {
  const dashboard = getAnalyticsSheet_();
  const data = buildGoogleSheetsDashboardData_();
  const metrics = data.metrics || {};
  const timezone = Session.getScriptTimeZone() || "Asia/Bishkek";
  const refreshedAt = Utilities.formatDate(new Date(), timezone, "dd.MM.yyyy HH:mm:ss");

  dashboard.getRange("A1:S90").breakApart();
  dashboard.clearContents();
  dashboard.getCharts().forEach((chart) => dashboard.removeChart(chart));
  dashboard.getBandings().forEach((banding) => banding.remove());
  dashboard.setHiddenGridlines(true);

  dashboard.getRange("A1:L1").merge().setValue("LIBERTERRA · ЕЖЕДНЕВНЫЙ КОНТРОЛЬ");
  dashboard.getRange("A2:L2").merge().setValue(
    "Обновлено: " + refreshedAt + " · реальные данные из «Пользователи», «Посещения», «Агенты», «Объекты» и «Заявки» · " + ANALYTICS_DASHBOARD_VERSION
  );

  const cards = [
    ["A4:C4", "A5:C6", "ПОСЕЩЕНИЯ СЕГОДНЯ", metrics.visits_today],
    ["D4:F4", "D5:F6", "РЕГИСТРАЦИИ СЕГОДНЯ", metrics.registrations_today],
    ["G4:I4", "G5:I6", "ДЕЙСТВИЯ СЕГОДНЯ", metrics.actions_today],
    ["J4:L4", "J5:L6", "НОВЫЕ ОБЪЕКТЫ СЕГОДНЯ", metrics.listings_today],
    ["A8:C8", "A9:C10", "ПОСЕЩЕНИЯ ЗА 7 ДНЕЙ", metrics.visits_7d],
    ["D8:F8", "D9:F10", "РЕГИСТРАЦИИ ЗА 7 ДНЕЙ", metrics.registrations_7d],
    ["G8:I8", "G9:I10", "АКТИВНЫЕ ЗАЯВКИ", metrics.active_requests],
    ["J8:L8", "J9:L10", "НОВЫЕ ЗАЯВКИ СЕГОДНЯ", metrics.requests_today],
    ["A12:C12", "A13:C14", "ВСЕГО ПОЛЬЗОВАТЕЛЕЙ", metrics.registered_users],
    ["D12:F12", "D13:F14", "ПОДТВЕРЖДЁННЫЕ АГЕНТЫ", metrics.approved_agents],
    ["G12:I12", "G13:I14", "АКТИВНЫЕ ОБЪЯВЛЕНИЯ", metrics.active_listings],
    ["J12:L12", "J13:L14", "ОБЪЕКТЫ НА ПРОВЕРКЕ", metrics.moderation_listings],
  ];
  cards.forEach((card) => setAdminDashboardCard_(dashboard, card[0], card[1], card[2], card[3]));

  dashboard.getRange("A35:G35").setValues([[
    "Дата", "Посетители", "Просмотры", "Регистрации", "Действия", "Новые объекты", "Новые заявки"
  ]]);
  const dailyRows = (data.daily || []).map((row) => [
    cleanText_(row.date),
    Number(row.visits || 0),
    Number(row.page_views || 0),
    Number(row.registrations || 0),
    Number(row.actions || 0),
    Number(row.listings || 0),
    Number(row.requests || 0),
  ]);
  if (dailyRows.length) dashboard.getRange(36, 1, dailyRows.length, 7).setValues(dailyRows);

  dashboard.getRange("I35:J35").setValues([["Популярная страница", "Просмотры за 30 дней"]]);
  const pageRows = (data.top_pages || []).map((row) => [
    cleanText_(row.page),
    Number(row.visits || 0),
  ]);
  if (pageRows.length) dashboard.getRange(36, 9, pageRows.length, 2).setValues(pageRows);

  dashboard.getRange("L35:S35").setValues([[
    "Последний пользователь", "Тип", "Username", "Регистрация", "Последний вход",
    "Объявления", "Заявки", "Последняя публикация"
  ]]);
  const userRows = (data.recent_users || []).map((row) => [
    cleanText_(row.name),
    cleanText_(row.account_type),
    row.username ? "@" + cleanText_(row.username) : "",
    dashboardDisplayDate_(row.registered_at),
    dashboardDisplayDate_(row.last_seen_at),
    Number(row.listings || 0),
    Number(row.requests || 0),
    dashboardDisplayDate_(row.last_publication),
  ]);
  if (userRows.length) dashboard.getRange(36, 12, userRows.length, 8).setValues(userRows);

  dashboard.getRange("A1:L1")
    .setBackground("#18283A")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(16)
    .setHorizontalAlignment("left");
  dashboard.getRange("A2:L2")
    .setBackground("#EEF1F4")
    .setFontColor("#6F716E")
    .setFontSize(10);
  dashboard.getRange("A35:G35").setBackground("#18283A").setFontColor("#FFFFFF").setFontWeight("bold");
  dashboard.getRange("I35:J35").setBackground("#18283A").setFontColor("#FFFFFF").setFontWeight("bold");
  dashboard.getRange("L35:S35").setBackground("#18283A").setFontColor("#FFFFFF").setFontWeight("bold");
  dashboard.getRange("A35:S70").setVerticalAlignment("middle").setWrap(true);
  dashboard.getRange("A36:G65").applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  dashboard.getRange("L36:S50").applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  dashboard.setFrozenRows(2);

  [120, 110, 110, 120, 110, 110, 120, 110, 110, 120, 18, 180, 115, 120, 145, 145, 95, 85, 150]
    .forEach((width, index) => dashboard.setColumnWidth(index + 1, width));
  dashboard.setRowHeight(1, 38);
  dashboard.setRowHeight(2, 26);
  [5, 6, 9, 10, 13, 14].forEach((row) => dashboard.setRowHeight(row, 28));

  if (dailyRows.length) {
    const trendChart = dashboard.newChart()
      .asLineChart()
      .addRange(dashboard.getRange(35, 1, dailyRows.length + 1, 4))
      .setPosition(16, 1, 0, 0)
      .setOption("title", "Аудитория и регистрации · 30 дней")
      .setOption("legend", { position: "bottom" })
      .setOption("colors", ["#18283A", "#8EA0B4", "#F5333A"])
      .setOption("backgroundColor", "#FFFFFF")
      .setOption("width", 650)
      .setOption("height", 330)
      .build();
    dashboard.insertChart(trendChart);

    const activityChart = dashboard.newChart()
      .asColumnChart()
      .addRange(dashboard.getRange(35, 1, dailyRows.length + 1, 1))
      .addRange(dashboard.getRange(35, 5, dailyRows.length + 1, 3))
      .setPosition(16, 7, 0, 20)
      .setOption("title", "Действия, объекты и заявки · 30 дней")
      .setOption("legend", { position: "bottom" })
      .setOption("colors", ["#F5333A", "#18283A", "#8EA0B4"])
      .setOption("backgroundColor", "#FFFFFF")
      .setOption("width", 650)
      .setOption("height", 330)
      .build();
    dashboard.insertChart(activityChart);
  }

  renderUserActivitySheet_(data.user_activity || []);
  renderModerationSheet_(data.moderation_items || []);

  return dashboard;
}

function userPublicationStatus_(listings, requests) {
  if (listings > 0 && requests > 0) return "Объявления и заявки";
  if (listings > 0) return "Есть объявления";
  if (requests > 0) return "Есть заявки";
  return "Нет публикаций";
}

function renderUserActivitySheet_(users) {
  const sheet = getUserActivitySheet_();
  const headers = [
    "Telegram ID", "Имя", "Username", "Телефон", "Тип", "Дата регистрации",
    "Последний вход", "Посещений", "Объявлений", "Заявок", "Всего публикаций",
    "Последняя публикация", "Статус"
  ];
  const rows = users.map((user) => {
    const listings = Number(user.listings || 0);
    const requests = Number(user.requests || 0);
    return [
      cleanText_(user.telegram_id),
      cleanText_(user.name),
      user.username ? "@" + cleanText_(user.username) : "",
      cleanText_(user.phone),
      cleanText_(user.account_type),
      dashboardDisplayDate_(user.registered_at),
      dashboardDisplayDate_(user.last_seen_at),
      Number(user.visits || 0),
      listings,
      requests,
      listings + requests,
      dashboardDisplayDate_(user.last_publication),
      userPublicationStatus_(listings, requests),
    ];
  });

  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getBandings().forEach((banding) => banding.remove());
  sheet.clearContents();
  sheet.setHiddenGridlines(false);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#18283A")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setWrap(true);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length)
      .setVerticalAlignment("middle")
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
    sheet.getRange(1, 1, rows.length + 1, headers.length).createFilter();
  }
  sheet.setFrozenRows(1);
  [115, 180, 135, 135, 115, 145, 145, 85, 90, 75, 115, 155, 170]
    .forEach((width, index) => sheet.setColumnWidth(index + 1, width));
  return sheet;
}

function renderModerationSheet_(items) {
  const sheet = getModerationSheet_();
  const headers = MODERATION_SHEET_HEADERS;
  const previous = {};
  if (sheet.getLastRow() >= 2 && sheet.getLastColumn() >= 1) {
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const currentMap = headerMap_(currentHeaders);
    if (currentMap["ID"]) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues()
        .forEach((row) => {
          const id = normalizeObjectId_(row[currentMap["ID"] - 1]);
          if (!id) return;
          previous[id] = {
            decision: currentMap["Решение"] ? cleanText_(row[currentMap["Решение"] - 1]) : "",
            reason: currentMap["Причина отклонения"] ? cleanText_(row[currentMap["Причина отклонения"] - 1]) : "",
            result: currentMap["Результат"] ? cleanText_(row[currentMap["Результат"] - 1]) : "",
            requestedAt: currentMap["Запрошено"] ? cleanText_(row[currentMap["Запрошено"] - 1]) : "",
            admin: currentMap["Администратор"] ? cleanText_(row[currentMap["Администратор"] - 1]) : "",
            actionId: currentMap["ID операции"] ? cleanText_(row[currentMap["ID операции"] - 1]) : "",
            processedAt: currentMap["Обработано"] ? cleanText_(row[currentMap["Обработано"] - 1]) : "",
          };
        });
    }
  }
  const rows = items.map((item) => [
    cleanText_(item.id),
    cleanText_(item.status) || "не указан",
    cleanText_(item.moderation_reason),
    cleanText_(item.title),
    cleanText_(item.deal),
    cleanText_(item.district),
    cleanText_(item.price),
    cleanText_(item.per),
    cleanText_(item.rooms),
    cleanText_(item.area),
    cleanText_(item.contact_name),
    cleanText_(item.phone),
    cleanText_(item.telegram_id),
    dashboardDisplayDate_(item.created_at),
    dashboardDisplayDate_(item.updated_at),
    cleanText_(item.photo_url),
    cleanText_(item.object_url),
    (previous[normalizeObjectId_(item.id)] || {}).decision || "",
    (previous[normalizeObjectId_(item.id)] || {}).reason || "",
    (previous[normalizeObjectId_(item.id)] || {}).result || "",
    (previous[normalizeObjectId_(item.id)] || {}).requestedAt || "",
    (previous[normalizeObjectId_(item.id)] || {}).admin || "",
    (previous[normalizeObjectId_(item.id)] || {}).actionId || "",
    (previous[normalizeObjectId_(item.id)] || {}).processedAt || "",
  ]);

  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getBandings().forEach((banding) => banding.remove());
  sheet.clearContents();
  sheet.setHiddenGridlines(false);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#18283A")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setWrap(true);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length)
      .setVerticalAlignment("middle")
      .setWrap(true)
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
    sheet.getRange(1, 1, rows.length + 1, headers.length).createFilter();
    const decisionColumn = headers.indexOf("Решение") + 1;
    const decisionRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Одобрить", "Отклонить"], true)
      .setAllowInvalid(false)
      .setHelpText("Выберите решение. Для отклонения сначала укажите причину в соседней колонке.")
      .build();
    sheet.getRange(2, decisionColumn, rows.length, 1).setDataValidation(decisionRule);
  }
  sheet.setFrozenRows(1);
  [80, 135, 220, 220, 100, 180, 100, 120, 80, 90, 170, 130, 125, 145, 145, 230, 230, 115, 220, 240, 145, 180, 220, 145]
    .forEach((width, index) => sheet.setColumnWidth(index + 1, width));
  return sheet;
}

function moderationDecisionCode_(value) {
  const normalized = cleanText_(value).toLowerCase().replace(/ё/g, "е");
  if (normalized === "одобрить") return "approve";
  if (normalized === "отклонить") return "reject";
  return "";
}

function moderationEditorEmail_(event) {
  try {
    if (event && event.user && typeof event.user.getEmail === "function") {
      const email = cleanText_(event.user.getEmail()).toLowerCase();
      if (email) return email;
    }
  } catch (error) {
    console.warn("Could not read moderation editor: " + error);
  }
  return cleanText_(Session.getActiveUser().getEmail()).toLowerCase();
}

function moderationAdminEmails_() {
  const configured = cleanText_(PropertiesService.getScriptProperties().getProperty("MODERATION_ADMIN_EMAILS"));
  return configured.split(/[;,\n]/).map((email) => cleanText_(email).toLowerCase()).filter(Boolean);
}

function moderationEditorAllowed_(email) {
  const allowed = moderationAdminEmails_();
  return Boolean(email) && allowed.indexOf(cleanText_(email).toLowerCase()) !== -1;
}

function handleModerationEdit(event) {
  if (!event || !event.range) return;
  const sheet = event.range.getSheet();
  if ([OBJECTS_SHEET_NAME, REQUESTS_SHEET_NAME].indexOf(sheet.getName()) !== -1) {
    syncCatalogEditsToLegacy_(event);
    return;
  }
  if (sheet.getName() !== MODERATION_SHEET_NAME || event.range.getRow() < 2) return;
  const headerMap = headerMap_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]);
  if (event.range.getColumn() !== headerMap["Решение"]) return;

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const row = event.range.getRow();
    const editor = moderationEditorEmail_(event);
    const decision = moderationDecisionCode_(sheet.getRange(row, headerMap["Решение"]).getDisplayValue());
    const reason = cleanText_(sheet.getRange(row, headerMap["Причина отклонения"]).getDisplayValue()).slice(0, 500);
    const objectId = normalizeObjectId_(sheet.getRange(row, headerMap["ID"]).getDisplayValue());
    const resultCell = sheet.getRange(row, headerMap["Результат"]);

    if (!decision) return;
    if (!moderationEditorAllowed_(editor)) {
      event.range.clearContent();
      resultCell.setValue("ОШИБКА: у аккаунта нет права модерировать");
      throw new Error("moderation_admin_not_allowed");
    }
    if (!objectId) {
      event.range.clearContent();
      resultCell.setValue("ОШИБКА: отсутствует ID объекта");
      return;
    }
    if (decision === "reject" && !reason) {
      event.range.clearContent();
      resultCell.setValue("ОШИБКА: сначала укажите причину отклонения");
      return;
    }

    const object = getObjectRecordById_(objectId);
    if (!object || cleanText_(object.deal).toLowerCase() === "запрос" || normalizedObjectStatus_(object.status) !== "moderation") {
      event.range.clearContent();
      resultCell.setValue("ОШИБКА: объект уже обработан или отсутствует в листе «Объекты»");
      return;
    }

    if (objectId.indexOf("site-") === 0) {
      upsertObjectFields_({id:objectId, status:decision === "approve" ? "опубликован" : "снят", updated_at:new Date().toISOString()}, PUBLIC_OBJECT_HEADERS, object);
      resultCell.setValue(decision === "approve" ? "Опубликовано на сайте" : "Отклонено: " + reason);
      return;
    }
    const queue = getModerationActionsSheet_();
    const pending = sheetRowsAsObjects_(queue, MODERATION_ACTION_HEADERS).some((action) => (
      objectIdsEqual_(action["ID объекта"], objectId)
      && ["pending", "processing"].indexOf(cleanText_(action["Статус"]).toLowerCase()) !== -1
    ));
    if (pending) {
      resultCell.setValue("Уже ожидает обработки ботом");
      return;
    }

    const actionId = Utilities.getUuid();
    const now = new Date();
    queue.appendRow([
      safeSheetValue_(actionId), safeSheetValue_(objectId), decision, safeSheetValue_(reason), now,
      safeSheetValue_(editor), "pending", "", "", ""
    ]);
    sheet.getRange(row, headerMap["Результат"]).setValue("Ожидает обработки ботом");
    sheet.getRange(row, headerMap["Запрошено"]).setValue(now);
    sheet.getRange(row, headerMap["Администратор"]).setValue(safeSheetValue_(editor));
    sheet.getRange(row, headerMap["ID операции"]).setValue(safeSheetValue_(actionId));
    sheet.getRange(row, headerMap["Обработано"]).clearContent();
  } finally {
    lock.releaseLock();
  }
}

function syncCatalogEditsToLegacy_(event) {
  const legacy = getLegacyCombinedSheet_();
  if (!legacy || event.range.getRow() < 2) return;
  const sheet = event.range.getSheet();
  const headerMap = ensureHeaders_(sheet, OBJECT_HEADERS);
  const firstRow = event.range.getRow();
  const lastRow = event.range.getLastRow();
  for (let rowNumber = firstRow; rowNumber <= lastRow; rowNumber += 1) {
    const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    const record = {};
    OBJECT_HEADERS.forEach((header) => {
      record[header] = values[headerMap[header] - 1];
    });
    if (cleanText_(record.id)) upsertFieldsInSheet_(legacy, record, OBJECT_HEADERS);
  }
  if ([OBJECTS_SHEET_NAME, REQUESTS_SHEET_NAME].indexOf(sheet.getName()) !== -1) {
    syncPublicCatalogSnapshotToD1_();
  }
}

function claimModerationActionsForBot_(payload) {
  const timestamp = Number(payload.timestamp);
  const requestId = cleanText_(payload.request_id);
  const canonical = requestId
    ? "claim_moderation_actions\n" + timestamp + "\n" + requestId
    : "claim_moderation_actions\n" + timestamp;
  if (!serverActionValid_(payload, canonical)) return { ok: false, error: "unauthorized_server_action" };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(MODERATION_ACTION_LOCK_WAIT_MS)) {
    return { ok: true, actions: [], busy: true, retry_after_seconds: 5 };
  }
  try {
    const queue = getModerationActionsSheet_();
    const headerMap = ensureHeaders_(queue, MODERATION_ACTION_HEADERS);
    const now = new Date();
    const actions = [];
    const queueRows = sheetRowsAsObjects_(queue, MODERATION_ACTION_HEADERS);

    // A retry can arrive after Apps Script leased rows but the HTTP response was
    // lost. Return the same rows to the same request instead of hiding them for
    // the full lease period or processing a second batch.
    if (requestId) {
      queueRows.forEach((row) => {
        if (actions.length >= 5) return;
        if (
          cleanText_(row["Статус"]).toLowerCase() !== "processing"
          || cleanText_(row[MODERATION_ACTION_CLAIM_HEADER]) !== requestId
        ) return;
        const object = getObjectRecordById_(row["ID объекта"]);
        actions.push(moderationActionPayload_(row, object));
      });
      if (actions.length) {
        return { ok: true, actions: actions, replayed: true };
      }
    }

    queueRows.forEach((row) => {
      if (actions.length >= 5) return;
      const status = cleanText_(row["Статус"]).toLowerCase();
      const claimedAt = dashboardDate_(row["Взято в работу"]);
      const leaseExpired = status === "processing" && (!claimedAt || now.getTime() - claimedAt.getTime() > MODERATION_ACTION_LEASE_MS);
      if (status !== "pending" && !leaseExpired) return;
      const object = getObjectRecordById_(row["ID объекта"]);
      queue.getRange(row._row, headerMap["Статус"]).setValue("processing");
      queue.getRange(row._row, headerMap["Взято в работу"]).setValue(now);
      if (requestId) {
        queue.getRange(row._row, headerMap[MODERATION_ACTION_CLAIM_HEADER]).setValue(requestId);
      }
      actions.push(moderationActionPayload_(row, object));
    });
    return { ok: true, actions: actions };
  } finally {
    lock.releaseLock();
  }
}

function moderationQueueHealthForBot_(payload) {
  const timestamp = Number(payload.timestamp);
  const canonical = "moderation_queue_health\n" + timestamp;
  if (!serverActionValid_(payload, canonical)) return { ok: false, error: "unauthorized_server_action" };

  const queue = getModerationActionsSheet_();
  const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
  sheetRowsAsObjects_(queue, MODERATION_ACTION_HEADERS).forEach((row) => {
    const status = cleanText_(row["Статус"]).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
  });
  return {
    ok: true,
    version: MODERATION_QUEUE_VERSION,
    pending: counts.pending,
    processing: counts.processing,
    completed: counts.completed,
    failed: counts.failed,
  };
}

function moderationActionPayload_(row, object) {
  return {
    action_id: cleanText_(row["ID операции"]),
    object_id: normalizeObjectId_(row["ID объекта"]),
    decision: cleanText_(row["Решение"]),
    reason: cleanText_(row["Причина"]),
    requested_by: cleanText_(row["Администратор"]),
    object: object || null,
  };
}

function completeModerationActionForBot_(payload) {
  const actionId = cleanText_(payload.action_id);
  const resultStatus = cleanText_(payload.result_status).toLowerCase();
  const timestamp = Number(payload.timestamp);
  const canonical = "complete_moderation_action\n" + actionId + "\n" + timestamp + "\n" + resultStatus;
  if (!serverActionValid_(payload, canonical)) return { ok: false, error: "unauthorized_server_action" };
  if (!actionId || ["completed", "failed"].indexOf(resultStatus) === -1) {
    return { ok: false, error: "invalid_completion" };
  }

  const queue = getModerationActionsSheet_();
  const headerMap = ensureHeaders_(queue, MODERATION_ACTION_HEADERS);
  const rowNumber = findValueRow_(queue, headerMap["ID операции"], actionId);
  if (!rowNumber) return { ok: false, error: "moderation_action_not_found" };
  const message = cleanText_(payload.message).slice(0, 1000);
  const processedAt = new Date();
  queue.getRange(rowNumber, headerMap["Статус"]).setValue(resultStatus);
  queue.getRange(rowNumber, headerMap["Результат"]).setValue(safeSheetValue_(message));
  queue.getRange(rowNumber, headerMap["Обработано"]).setValue(processedAt);

  const action = sheetRowsAsObjects_(queue, MODERATION_ACTION_HEADERS).find((row) => row._row === rowNumber);
  const moderation = getModerationSheet_();
  if (action && moderation.getLastRow() >= 2) {
    const moderationMap = ensureHeaders_(moderation, MODERATION_SHEET_HEADERS);
    const moderationRow = findValueRow_(moderation, moderationMap["ID операции"], actionId);
    if (moderationRow) {
      moderation.getRange(moderationRow, moderationMap["Результат"]).setValue(safeSheetValue_(message));
      moderation.getRange(moderationRow, moderationMap["Обработано"]).setValue(processedAt);
    }
  }
  return { ok: true, action_id: actionId, status: resultStatus };
}

function setupModerationControls() {
  const email = cleanText_(Session.getEffectiveUser().getEmail()).toLowerCase();
  const properties = PropertiesService.getScriptProperties();
  if (!cleanText_(properties.getProperty("MODERATION_ADMIN_EMAILS")) && email) {
    properties.setProperty("MODERATION_ADMIN_EMAILS", email);
  }
  refreshModerationSheet();
  getModerationActionsSheet_();
  protectModerationControlColumns_();
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "handleModerationEdit")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger("handleModerationEdit")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  return "Безопасная модерация включена для: " + moderationAdminEmails_().join(", ");
}

function protectModerationControlColumns_() {
  const sheet = getModerationSheet_();
  ensureHeaders_(sheet, MODERATION_SHEET_HEADERS);
  sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)
    .filter((protection) => protection.getDescription() === "Liberterra moderation controls")
    .forEach((protection) => protection.remove());
  const protection = sheet.protect()
    .setDescription("Liberterra moderation controls");
  const allowed = moderationAdminEmails_();
  const editors = protection.getEditors();
  if (editors.length) protection.removeEditors(editors);
  if (allowed.length) protection.addEditors(allowed);
  if (protection.canDomainEdit()) protection.setDomainEdit(false);

  const queue = getModerationActionsSheet_();
  queue.getProtections(SpreadsheetApp.ProtectionType.SHEET)
    .filter((item) => item.getDescription() === "Liberterra moderation audit")
    .forEach((item) => item.remove());
  const queueProtection = queue.protect().setDescription("Liberterra moderation audit");
  const queueEditors = queueProtection.getEditors();
  if (queueEditors.length) queueProtection.removeEditors(queueEditors);
  if (allowed.length) queueProtection.addEditors(allowed);
  if (queueProtection.canDomainEdit()) queueProtection.setDomainEdit(false);
}

function setAdminDashboardCard_(sheet, labelRange, valueRange, label, value) {
  const labelCell = sheet.getRange(labelRange).merge();
  const valueCell = sheet.getRange(valueRange).merge();
  labelCell
    .setValue(label)
    .setBackground("#F2F4F6")
    .setFontColor("#6F716E")
    .setFontWeight("bold")
    .setFontSize(9)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  valueCell
    .setValue(Number(value || 0))
    .setNumberFormat("0")
    .setBackground("#FFFFFF")
    .setFontColor("#F5333A")
    .setFontWeight("bold")
    .setFontSize(22)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.getRange(labelRange).setBorder(true, true, false, true, false, false, "#DADDE1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(valueRange).setBorder(false, true, true, true, false, false, "#DADDE1", SpreadsheetApp.BorderStyle.SOLID);
}

function dashboardDisplayDate_(value) {
  const date = dashboardDate_(value);
  if (!date) return cleanText_(value);
  const timezone = Session.getScriptTimeZone() || "Asia/Bishkek";
  return Utilities.formatDate(date, timezone, "dd.MM.yyyy HH:mm");
}

function refreshAdminDashboard() {
  renderAdminDashboardSheet_();
  return "Дашборд Liberterra обновлён";
}

function refreshModerationSheet() {
  const data = buildGoogleSheetsDashboardData_();
  const items = data.moderation_items || [];
  renderModerationSheet_(items);
  return "Лист «На модерации» обновлён. Объектов: " + items.length;
}

function setupAdminDashboard() {
  renderAdminDashboardSheet_();
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "refreshAdminDashboard")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger("refreshAdminDashboard")
    .timeBased()
    .everyHours(1)
    .create();
  return "Дашборд Liberterra создан. Автообновление: каждый час.";
}

function ensureHeaders_(sheet, requiredHeaders) {
  const width = Math.max(sheet.getLastColumn(), requiredHeaders.length, 1);
  const current = sheet.getRange(1, 1, 1, width).getValues()[0];
  const currentHeaders = current.map((value) => cleanText_(value));

  if (currentHeaders.join("") === "") {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return headerMap_(requiredHeaders);
  }

  const missingHeaders = requiredHeaders.filter((header) => currentHeaders.indexOf(header) === -1);
  if (missingHeaders.length) {
    const startColumn = sheet.getLastColumn() + 1;
    sheet.getRange(1, startColumn, 1, missingHeaders.length).setValues([missingHeaders]);
    missingHeaders.forEach((header, index) => currentHeaders[startColumn - 1 + index] = header);
  }

  return headerMap_(currentHeaders);
}

function headerMap_(headers) {
  return headers.reduce((map, header, index) => {
    if (header) {
      map[header] = index + 1;
    }
    return map;
  }, {});
}

function findAgentRow_(sheet, telegramIdColumn, telegramId) {
  return findValueRow_(sheet, telegramIdColumn, telegramId);
}

function findValueRow_(sheet, column, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 0;
  }

  const values = sheet.getRange(2, column, lastRow - 1, 1).getDisplayValues();
  const target = cleanText_(value);
  for (let index = 0; index < values.length; index += 1) {
    if (cleanText_(values[index][0]) === target) {
      return index + 2;
    }
  }
  return 0;
}

function normalizeAgentSpecialization_(value) {
  const normalized = cleanText_(value).toLowerCase().replace(/ё/g, "е");
  const aliases = {
    rent: "rent",
    "аренда": "rent",
    sale: "sale",
    "продажа": "sale",
  };
  return aliases[normalized] || "";
}

function agentSpecializationLabel_(specialization) {
  const normalized = normalizeAgentSpecialization_(specialization);
  if (normalized === "rent") return "Аренда";
  if (normalized === "sale") return "Продажа";
  return "Не указано";
}

function isAgentTermsAccepted_(value) {
  if (value === true) return true;
  const normalized = cleanText_(value).toLowerCase().replace(/ё/g, "е");
  return ["да", "true", "yes", "1", "принято"].indexOf(normalized) !== -1;
}

function agentCommissionForSpecialization_(specialization) {
  const normalized = normalizeAgentSpecialization_(specialization);
  const commission = {
    platform_share: AGENT_COMMISSION_CONFIG.platform_share,
    listing_share: AGENT_COMMISSION_CONFIG.listing_share,
    closing_share: AGENT_COMMISSION_CONFIG.closing_share,
  };
  if (normalized === "sale") {
    commission.sale_rate = AGENT_COMMISSION_CONFIG.sale_rate;
  }
  if (normalized === "rent") {
    commission.rent_rate = AGENT_COMMISSION_CONFIG.rent_rate;
  }
  return commission;
}

function agentTermsForSpecialization_(specialization) {
  const normalized = normalizeAgentSpecialization_(specialization);
  const dealPrefix = normalized === "sale" ? "Продажа" : normalized === "rent" ? "Аренда" : "";
  if (!dealPrefix) return [];
  return AGENT_TERMS_CONFIG.sections.map((section) => {
    const copy = {
      title: section.title,
      paragraphs: Array.isArray(section.paragraphs) ? section.paragraphs.slice() : [],
      bullets: Array.isArray(section.bullets) ? section.bullets.slice() : [],
      after: Array.isArray(section.after) ? section.after.slice() : [],
    };
    if (dealPrefix && (section.title === "РАЗМЕР КОМИССИИ" || section.title === "ПРИМЕРЫ")) {
      copy.bullets = copy.bullets.filter((text) => cleanText_(text).indexOf(dealPrefix) === 0);
    }
    return copy;
  });
}

function roleFromStatus_(status) {
  const normalized = cleanText_(status).toLowerCase().replace(/ё/g, "е");
  if (normalized === "на проверке" || normalized === "pending") return "pending";
  if (normalized === "одобрен" || normalized === "approved") return "approved";
  if (normalized === "отклонен" || normalized === "rejected") return "rejected";
  return "guest";
}

function parseRequestPayload_(e) {
  const raw = e && e.postData ? e.postData.contents : "";
  if (!raw) {
    return {};
  }
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
}

function parseQueryString_(raw) {
  return String(raw || "").split("&").reduce((fields, part) => {
    const separator = part.indexOf("=");
    const rawKey = separator === -1 ? part : part.slice(0, separator);
    const rawValue = separator === -1 ? "" : part.slice(separator + 1);
    const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
    fields[key] = decodeURIComponent(rawValue.replace(/\+/g, " "));
    return fields;
  }, {});
}

function normalizeUsername_(value) {
  return cleanText_(value).replace(/^@+/, "");
}

function sanitizeFileName_(value) {
  return cleanText_(value).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "document";
}

function bytesToHex_(bytes) {
  return bytes.map((value) => ("0" + ((value + 256) % 256).toString(16)).slice(-2)).join("");
}

function constantTimeEqual_(left, right) {
  if (left.length !== right.length || !left.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function isValidWorkPhone_(value) {
  const phone = cleanText_(value);
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9
    && digits.length <= 15
    && /^[0-9+().\-\s]+$/.test(phone);
}

function cleanText_(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

function safeSheetValue_(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    return value;
  }
  const cleaned = value.trim();
  return /^[=+\-@]/.test(cleaned) ? "'" + cleaned : cleaned;
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates the separate «Объекты» and «Заявки» tabs and safely copies all
 * records from the legacy combined «Objects» tab. The legacy tab is kept as a
 * compatibility mirror for the currently published CSV URL and is never
 * deleted by this migration. Re-running the function is idempotent.
 */
function setupSeparateCatalogSheets() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
  const objectSheet = getObjectsSheet_();
  const requestSheet = getRequestsSheet_();
  ensureHeaders_(objectSheet, OBJECT_HEADERS);
  ensureHeaders_(requestSheet, OBJECT_HEADERS);

  const legacy = getLegacyCombinedSheet_();
  const objectMap = {};
  const requestMap = {};
  let copiedObjects = 0;
  let copiedRequests = 0;
  const collect = (record, fromLegacy) => {
    const id = normalizeObjectId_(record.id);
    if (!id) return;
    const target = cleanText_(record.deal).toLowerCase() === "запрос" ? requestMap : objectMap;
    const values = {};
    OBJECT_HEADERS.forEach((header) => { values[header] = record[header]; });
    target[id] = values;
    if (fromLegacy && target === requestMap) copiedRequests += 1;
    if (fromLegacy && target === objectMap) copiedObjects += 1;
  };
  if (legacy) {
    ensureHeaders_(legacy, OBJECT_HEADERS);
    sheetRowsAsObjects_(legacy, OBJECT_HEADERS).forEach((record) => collect(record, true));
  }
  sheetRowsAsObjects_(objectSheet, OBJECT_HEADERS).forEach((record) => collect(record, false));
  sheetRowsAsObjects_(requestSheet, OBJECT_HEADERS).forEach((record) => collect(record, false));

  const writeRows = (sheet, records) => {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    const rows = Object.keys(records).map((id) => (
      OBJECT_HEADERS.map((header) => safeSheetValue_(records[id][header]))
    ));
    if (rows.length) sheet.getRange(2, 1, rows.length, OBJECT_HEADERS.length).setValues(rows);
  };
  writeRows(objectSheet, objectMap);
  writeRows(requestSheet, requestMap);

  [objectSheet, requestSheet].forEach((sheet) => {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, OBJECT_HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#172b3d")
      .setFontColor("#ffffff");
    sheet.autoResizeColumns(1, Math.min(OBJECT_HEADERS.length, 12));
  });
  const hasEditTrigger = ScriptApp.getProjectTriggers()
    .some((trigger) => trigger.getHandlerFunction() === "handleModerationEdit");
  if (!hasEditTrigger) {
    ScriptApp.newTrigger("handleModerationEdit")
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
      .onEdit()
      .create();
  }
  SpreadsheetApp.flush();

  const result = {
    ok: true,
    objects_sheet: OBJECTS_SHEET_NAME,
    objects_sheet_id: objectSheet.getSheetId(),
    objects: Object.keys(objectMap).length,
    requests_sheet: REQUESTS_SHEET_NAME,
    requests_sheet_id: requestSheet.getSheetId(),
    requests: Object.keys(requestMap).length,
    copied_objects: copiedObjects,
    copied_requests: copiedRequests,
    legacy_sheet_kept: Boolean(legacy),
  };
  console.log(JSON.stringify(result));
  return result;
  } finally {
    lock.releaseLock();
  }
}

function setupAgentAccess() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty("BOT_TOKEN")) {
    throw new Error("Добавьте BOT_TOKEN в свойства скрипта.");
  }
  if (!properties.getProperty("ADMIN_CHAT_ID")) {
    throw new Error("Добавьте ADMIN_CHAT_ID в свойства скрипта.");
  }

  ensureHeaders_(getObjectsSheet_(), OBJECT_HEADERS);
  ensureHeaders_(getRequestsSheet_(), OBJECT_HEADERS);
  ensureHeaders_(getAgentsSheet_(), AGENT_HEADERS);
  ensureHeaders_(getUsersSheet_(), USER_HEADERS);
  ensureHeaders_(getAccessClaimsSheet_(), ACCESS_CLAIM_HEADERS);
  ensureHeaders_(getUserFavoritesSheet_(), USER_FAVORITE_HEADERS);
  ensureHeaders_(getObjectAgentLinksSheet_(), ["object_id", "listing_agent_id", "poster_type"]);
  ensureHeaders_(getAgentNotesSheet_(), AGENT_NOTE_HEADERS);
  ensureHeaders_(getAgentCommentsSheet_(), AGENT_COMMENT_HEADERS);
  ensureHeaders_(getAgentClientsSheet_(), AGENT_CLIENT_HEADERS);
  ensureHeaders_(getMessageThreadsSheet_(), MESSAGE_THREAD_HEADERS);
  ensureHeaders_(getMessageEntriesSheet_(), MESSAGE_ENTRY_HEADERS);
  getAgentDocumentsFolder_();
  getOwnerContractsFolder_();
  return "Liberterra agent access is ready";
}

function setupAnalytics() {
  return setupAdminDashboard();
}

function setupUserTracking() {
  const usersSheet = getUsersSheet_();
  ensureHeaders_(usersSheet, USER_HEADERS);
  const visitsSheet = getVisitsSheet_();
  ensureHeaders_(visitsSheet, VISIT_HEADERS);
  return "Liberterra user tracking is ready";
}

// Private consultation storage; only requests signed by the existing bot secret.
function newbuildingConsultation_(input) {
  const token=PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  if(!token || typeof input.payload!=='string' || input.payload.length>6000) return {ok:false,error:'unauthorized'};
  const hex=Utilities.computeHmacSha256Signature('newbuilding-consultation\n'+input.payload,token).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
  if(!constantTimeEqual_(hex,String(input.signature||''))) return {ok:false,error:'unauthorized'};
  const d=JSON.parse(input.payload), now=Date.now();
  if(Math.abs(now-d.timestamp)>300000 || d.consent!==true || !/^[0-9a-f-]{36}$/.test(d.id) || !['mansara','termeli','leven'].includes(d.project)) return {ok:false,error:'invalid'};
  const lock=LockService.getScriptLock(); if(!lock.tryLock(5000)) return {ok:false,error:'busy'};
  try {
    const book=SpreadsheetApp.getActiveSpreadsheet();
    const sheet=book.getSheetByName('Консультации ЖК')||book.insertSheet('Консультации ЖК');
    if(!sheet.getLastRow()) sheet.appendRow(['ID','Создано','ЖК','Тема','Имя','Телефон','Вопрос','Согласие','Статус','Уведомление','IP hash']);
    const rows=sheet.getDataRange().getValues();
    if(rows.slice(1).some(r=>String(r[0])===d.id)) return {ok:true,id:d.id};
    if(rows.slice(1).filter(r=>now-new Date(r[1]).getTime()<3600000 && (String(r[10])===d.ip || String(r[5]).replace(/^'/,'')===d.phone)).length>=3) return {ok:false,error:'rate_limit'};
    // Prefix untrusted cells to prevent spreadsheet-formula execution.
    const safe=x=>"'"+String(x||'');
    sheet.appendRow([d.id,new Date(now),d.project,d.topic,safe(d.name),safe(d.phone),safe(d.question),'Да','Новая','Ожидает',d.ip]);
    SpreadsheetApp.flush();
    const row=sheet.getLastRow();
    try {
      const text=['🏢 Консультация по ЖК',d.project,'ID: '+d.id,'Тема: '+d.topic,'Имя: '+d.name,'Телефон: '+d.phone,'Вопрос: '+(d.question||'—'),'Заявка сохранена в листе «Консультации ЖК».'].join('\n');
      const response=UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/sendMessage',{method:'post',contentType:'application/json',payload:JSON.stringify({chat_id:d.admin,text,disable_web_page_preview:true}),muteHttpExceptions:true});
      sheet.getRange(row,10).setValue(JSON.parse(response.getContentText()).ok===true?'Доставлено':'Ошибка — проверить вручную');
    } catch(_) {sheet.getRange(row,10).setValue('Не подтверждено — проверить вручную');}
    return {ok:true,id:d.id};
  } finally {lock.releaseLock();}
}
const AGENT_PRIVATE_OBJECTS_SHEET_NAME = "Agent Private Objects";

const AGENT_PRIVATE_ACCESS_SHEET_NAME = "Agent Private Access";

const AGENT_PRIVATE_FILES_FOLDER_NAME = "Liberterra Private Object Files";

const MAX_AGENT_PRIVATE_FILE_BYTES = 5 * 1024 * 1024;

const AGENT_PRIVATE_OBJECT_HEADERS = [
  "object_id", "owner_agent_id", "owner_contact_name", "owner_contact_phone",
  "owner_contact_whatsapp", "legal_status", "work_notes", "documents_json", "updated_at",
];

const AGENT_PRIVATE_ACCESS_HEADERS = [
  "request_id", "object_id", "owner_agent_id", "requester_agent_id", "requester_name",
  "requested_scopes_json", "status", "granted_scopes_json", "created_at", "decided_at",
];

const AGENT_PRIVATE_SCOPES_ = ["owner_contact", "legal_docs", "owner_contract", "other_docs", "work_notes"];

const AGENT_PRIVATE_DOCUMENT_TYPES_ = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function getAgentPrivateBook_() {
  const properties = PropertiesService.getScriptProperties();
  const id = properties.getProperty("AGENT_PRIVATE_SPREADSHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  const book = SpreadsheetApp.create("Liberterra Private CRM");
  DriveApp.getFileById(book.getId()).setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  properties.setProperty("AGENT_PRIVATE_SPREADSHEET_ID", book.getId());
  return book;
}

function getAgentPrivateObjectsSheet_() {
  const book = getAgentPrivateBook_();
  const sheet = book.getSheetByName(AGENT_PRIVATE_OBJECTS_SHEET_NAME) || book.insertSheet(AGENT_PRIVATE_OBJECTS_SHEET_NAME);
  ensureHeaders_(sheet, AGENT_PRIVATE_OBJECT_HEADERS);
  return sheet;
}

function agentPrivateContext_(payload) {
  const registered = registeredUserContext_(payload);
  if (!registered.ok) return registered;
  const ownerKey = payload.object_id ? agentPrivateOwnerId_(payload.object_id) : "";
  // Keep the original storage key after linking Telegram; never rewrite old rows.
  if (ownerKey && ownsListingKey_(registered,ownerKey)) return Object.assign({},registered,{telegramId:ownerKey});
  return approvedAgentContext_(payload, registered);
}

function getAgentPrivateAccessSheet_() {
  const book = getAgentPrivateBook_();
  const sheet = book.getSheetByName(AGENT_PRIVATE_ACCESS_SHEET_NAME) || book.insertSheet(AGENT_PRIVATE_ACCESS_SHEET_NAME);
  ensureHeaders_(sheet, AGENT_PRIVATE_ACCESS_HEADERS);
  return sheet;
}

function agentPrivateScopes_(value) {
  let scopes = value;
  if (typeof scopes === "string") {
    try { scopes = JSON.parse(scopes); } catch (_) { scopes = []; }
  }
  if (!Array.isArray(scopes)) return [];
  return Array.from(new Set(scopes.map(cleanText_).filter((scope) => AGENT_PRIVATE_SCOPES_.indexOf(scope) !== -1)));
}

function agentPrivateDocuments_(value) {
  try {
    const docs = typeof value === "string" ? JSON.parse(value || "[]") : value;
    if (!Array.isArray(docs)) return [];
    return docs.filter((doc) => doc && /^[0-9a-f-]{36}$/i.test(cleanText_(doc.id))
      && /^[A-Za-z0-9_-]{10,200}$/.test(cleanText_(doc.drive_id))
      && AGENT_PRIVATE_SCOPES_.indexOf(cleanText_(doc.category)) !== -1);
  } catch (_) { return []; }
}

function agentPrivateOwnerId_(objectId) {
  return cleanText_(listingAgentIdForObject_(objectId, objectAgentLinks_()));
}

function agentPrivatePublicObject_(objectId) {
  const record = getObjectRecordById_(objectId);
  return record && isPublicCrmObject_(record) && cleanText_(record.deal).toLowerCase() !== "запрос" ? record : null;
}

function agentPrivateRecord_(objectId, ownerId) {
  return sheetRowsAsObjects_(getAgentPrivateObjectsSheet_(), AGENT_PRIVATE_OBJECT_HEADERS)
    .find((row) => objectIdsEqual_(row.object_id, objectId) && cleanText_(row.owner_agent_id) === cleanText_(ownerId)) || null;
}

function agentPrivateAccessRows_() {
  return sheetRowsAsObjects_(getAgentPrivateAccessSheet_(), AGENT_PRIVATE_ACCESS_HEADERS);
}

function activeAgentPrivateGrant_(objectId, ownerId, requesterId) {
  return agentPrivateAccessRows_().find((row) => objectIdsEqual_(row.object_id, objectId)
    && cleanText_(row.owner_agent_id) === cleanText_(ownerId)
    && cleanText_(row.requester_agent_id) === cleanText_(requesterId)
    && cleanText_(row.status) === "approved") || null;
}

function agentPrivatePublicSummary_(row, includeRequester) {
  return {
    request_id: cleanText_(row.request_id), object_id: normalizeObjectId_(row.object_id),
    requester_name: includeRequester ? cleanText_(row.requester_name) : "",
    requested_scopes: agentPrivateScopes_(row.requested_scopes_json),
    granted_scopes: agentPrivateScopes_(row.granted_scopes_json),
    status: cleanText_(row.status), created_at: row.created_at || "", decided_at: row.decided_at || "",
  };
}

function getAgentPrivateObject_(payload) {
  const context = agentPrivateContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  if (!objectId) return { ok: false, error: "object_not_found" };
  const ownerId = agentPrivateOwnerId_(objectId);
  if (!ownerId) return { ok: false, error: "object_not_found" };
  const isOwner = ownerId === context.telegramId;
  const record = agentPrivateRecord_(objectId, ownerId);
  const grant = isOwner ? null : activeAgentPrivateGrant_(objectId, ownerId, context.telegramId);
  if (!isOwner && !grant) return { ok: true, access_required: true, object_id: objectId, data: null };
  const allowed = isOwner ? AGENT_PRIVATE_SCOPES_ : agentPrivateScopes_(grant.granted_scopes_json);
  const data = {
    owner_contact_name: allowed.indexOf("owner_contact") !== -1 ? cleanText_(record && record.owner_contact_name) : "",
    owner_contact_phone: allowed.indexOf("owner_contact") !== -1 ? cleanText_(record && record.owner_contact_phone) : "",
    owner_contact_whatsapp: allowed.indexOf("owner_contact") !== -1 ? cleanText_(record && record.owner_contact_whatsapp) : "",
    legal_status: allowed.indexOf("legal_docs") !== -1 ? cleanText_(record && record.legal_status) : "",
    work_notes: allowed.indexOf("work_notes") !== -1 ? cleanText_(record && record.work_notes) : "",
    documents: isOwner ? agentPrivateDocuments_(record && record.documents_json) : agentPrivateDocuments_(record && record.documents_json)
      .filter((doc) => allowed.indexOf(doc.category) !== -1)
      .map(({ id, name, mime_type, size, category, created_at }) => ({ id, name, mime_type, size, category, created_at })),
  };
  return { ok: true, access_required: false, is_owner: isOwner, object_id: objectId, data: data,
    access: grant ? agentPrivatePublicSummary_(grant, false) : null };
}

function saveAgentPrivateObject_(payload) {
  const context = agentPrivateContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  if (!objectId || agentPrivateOwnerId_(objectId) !== context.telegramId) return { ok: false, error: "private_object_owner_only" };
  const fields = payload.data && typeof payload.data === "object" ? payload.data : {};
  const limits = { owner_contact_name: 120, owner_contact_phone: 40, owner_contact_whatsapp: 40, legal_status: 500, work_notes: 3000 };
  const rowData = {};
  Object.keys(limits).forEach((key) => { rowData[key] = cleanText_(fields[key]).slice(0, limits[key]); });
  const sheet = getAgentPrivateObjectsSheet_();
  const headers = ensureHeaders_(sheet, AGENT_PRIVATE_OBJECT_HEADERS);
  const rows = sheetRowsAsObjects_(sheet, AGENT_PRIVATE_OBJECT_HEADERS);
  const existing = rows.find((row) => objectIdsEqual_(row.object_id, objectId) && cleanText_(row.owner_agent_id) === context.telegramId);
  const documentsJson = existing ? JSON.stringify(agentPrivateDocuments_(existing.documents_json)) : "[]";
  const updatedAt = new Date();
  const values = [objectId, context.telegramId, rowData.owner_contact_name, rowData.owner_contact_phone,
    rowData.owner_contact_whatsapp, rowData.legal_status, rowData.work_notes, documentsJson, updatedAt];
  const rowNumber = existing ? existing._row : Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(rowNumber, 1, 1, AGENT_PRIVATE_OBJECT_HEADERS.length).setValues([values.map((value) => typeof value === "string" ? safeSheetValue_(value) : value)]);
  return { ok: true, saved: true, updated_at: updatedAt.toISOString() };
}

function requestAgentPrivateAccess_(payload) {
  const context = agentPrivateContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  const object = agentPrivatePublicObject_(objectId);
  if (!object) return { ok: false, error: "object_unavailable" };
  const ownerId = agentPrivateOwnerId_(objectId);
  if (!ownerId || ownerId === context.telegramId) return { ok: false, error: "private_access_not_applicable" };
  const scopes = agentPrivateScopes_(payload.requested_scopes);
  if (!scopes.length) return { ok: false, error: "private_access_scopes_required" };
  const sheet = getAgentPrivateAccessSheet_();
  const rows = sheetRowsAsObjects_(sheet, AGENT_PRIVATE_ACCESS_HEADERS);
  const prior = rows.find((row) => objectIdsEqual_(row.object_id, objectId)
    && cleanText_(row.requester_agent_id) === context.telegramId && ["pending", "approved"].indexOf(cleanText_(row.status)) !== -1);
  if (prior) return { ok: true, request: agentPrivatePublicSummary_(prior, false), already_requested: true };
  const requestId = Utilities.getUuid();
  const now = new Date();
  sheet.appendRow([requestId, objectId, ownerId, context.telegramId, safeSheetValue_(context.name),
    JSON.stringify(scopes), "pending", "[]", now, ""]);
  return { ok: true, request: { request_id: requestId, status: "pending", requested_scopes: scopes, created_at: now.toISOString() } };
}

function listAgentPrivateAccess_(payload) {
  const context = agentPrivateContext_(payload);
  if (!context.ok) return context;
  const rows = agentPrivateAccessRows_();
  return { ok: true,
    incoming: rows.filter((row) => cleanText_(row.owner_agent_id) === context.telegramId && ["pending", "approved"].indexOf(cleanText_(row.status)) !== -1)
      .map((row) => agentPrivatePublicSummary_(row, true)),
    outgoing: rows.filter((row) => cleanText_(row.requester_agent_id) === context.telegramId)
      .map((row) => agentPrivatePublicSummary_(row, false)),
  };
}

function decideAgentPrivateAccess_(payload) {
  const context = agentPrivateContext_(payload);
  if (!context.ok) return context;
  const requestId = cleanText_(payload.request_id);
  const sheet = getAgentPrivateAccessSheet_();
  const headers = ensureHeaders_(sheet, AGENT_PRIVATE_ACCESS_HEADERS);
  const row = sheetRowsAsObjects_(sheet, AGENT_PRIVATE_ACCESS_HEADERS).find((item) => cleanText_(item.request_id) === requestId);
  if (!row || cleanText_(row.owner_agent_id) !== context.telegramId || cleanText_(row.status) !== "pending") return { ok: false, error: "private_access_request_not_found" };
  if (agentPrivateOwnerId_(row.object_id) !== context.telegramId) return { ok: false, error: "private_object_owner_only" };
  const decision = cleanText_(payload.decision);
  if (!["approve", "deny"].includes(decision)) return { ok: false, error: "invalid_private_access_decision" };
  const requested = agentPrivateScopes_(row.requested_scopes_json);
  const granted = decision === "approve" ? agentPrivateScopes_(payload.granted_scopes).filter((scope) => requested.indexOf(scope) !== -1) : [];
  if (decision === "approve" && !granted.length) return { ok: false, error: "private_access_scopes_required" };
  const now = new Date();
  sheet.getRange(row._row, headers.status).setValue(decision === "approve" ? "approved" : "denied");
  sheet.getRange(row._row, headers.granted_scopes_json).setValue(JSON.stringify(granted));
  sheet.getRange(row._row, headers.decided_at).setValue(now);
  return { ok: true, status: decision === "approve" ? "approved" : "denied", granted_scopes: granted };
}

function revokeAgentPrivateAccess_(payload) {
  const context = agentPrivateContext_(payload);
  if (!context.ok) return context;
  const requestId = cleanText_(payload.request_id);
  const sheet = getAgentPrivateAccessSheet_();
  const headers = ensureHeaders_(sheet, AGENT_PRIVATE_ACCESS_HEADERS);
  const row = sheetRowsAsObjects_(sheet, AGENT_PRIVATE_ACCESS_HEADERS).find((item) => cleanText_(item.request_id) === requestId);
  if (!row || cleanText_(row.owner_agent_id) !== context.telegramId || cleanText_(row.status) !== "approved") return { ok: false, error: "private_access_grant_not_found" };
  if (agentPrivateOwnerId_(row.object_id) !== context.telegramId) return { ok: false, error: "private_object_owner_only" };
  sheet.getRange(row._row, headers.status).setValue("revoked");
  sheet.getRange(row._row, headers.granted_scopes_json).setValue("[]");
  sheet.getRange(row._row, headers.decided_at).setValue(new Date());
  return { ok: true, revoked: true };
}

function getAgentPrivateFilesFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const savedFolderId = properties.getProperty("AGENT_PRIVATE_FILES_FOLDER_ID");
  if (savedFolderId) {
    try { return DriveApp.getFolderById(savedFolderId); } catch (_) { /* Recreate a missing folder. */ }
  }
  const matches = DriveApp.getFoldersByName(AGENT_PRIVATE_FILES_FOLDER_NAME);
  const folder = matches.hasNext() ? matches.next() : DriveApp.createFolder(AGENT_PRIVATE_FILES_FOLDER_NAME);
  folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  properties.setProperty("AGENT_PRIVATE_FILES_FOLDER_ID", folder.getId());
  return folder;
}

function uploadAgentPrivateDocument_(payload) {
  const context = agentPrivateContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  if (!objectId || agentPrivateOwnerId_(objectId) !== context.telegramId) return { ok: false, error: "private_object_owner_only" };
  const category = cleanText_(payload.category);
  if (["legal_docs", "owner_contract", "other_docs"].indexOf(category) === -1) return { ok: false, error: "invalid_document_category" };
  const mimeType = cleanText_(payload.file_type).toLowerCase();
  const extension = AGENT_PRIVATE_DOCUMENT_TYPES_[mimeType];
  const encoded = cleanText_(payload.file_base64);
  if (!extension || !encoded || encoded.length > Math.ceil(MAX_AGENT_PRIVATE_FILE_BYTES * 4 / 3) + 8 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return { ok: false, error: "invalid_private_file" };
  let bytes;
  try { bytes = Utilities.base64Decode(encoded); } catch (_) { return { ok: false, error: "invalid_private_file" }; }
  if (!bytes.length || bytes.length > MAX_AGENT_PRIVATE_FILE_BYTES) return { ok: false, error: "private_file_size_invalid" };
  const byte = (index) => (bytes[index] + 256) % 256;
  const validSignature = mimeType === "application/pdf"
    ? bytes.length >= 5 && String.fromCharCode(byte(0), byte(1), byte(2), byte(3), byte(4)) === "%PDF-"
    : mimeType === "image/jpeg"
      ? bytes.length >= 3 && byte(0) === 0xff && byte(1) === 0xd8 && byte(2) === 0xff
      : mimeType === "image/png"
        ? bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => byte(index) === value)
        : false;
  if (!validSignature) return { ok: false, error: "invalid_private_file" };
  const record = agentPrivateRecord_(objectId, context.telegramId);
  const docs = agentPrivateDocuments_(record && record.documents_json);
  if (docs.length >= 20) return { ok: false, error: "private_file_limit_reached" };
  const name = sanitizeFileName_(payload.file_name || "document").slice(0, 100) || "document";
  const fileId = Utilities.getUuid();
  const file = getAgentPrivateFilesFolder_().createFile(Utilities.newBlob(bytes, mimeType, fileId + "_" + name));
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  const metadata = { id: fileId, drive_id: file.getId(), name: name, mime_type: mimeType, size: bytes.length, category: category, created_at: new Date().toISOString() };
  docs.push(metadata);
  const sheet = getAgentPrivateObjectsSheet_();
  const headers = ensureHeaders_(sheet, AGENT_PRIVATE_OBJECT_HEADERS);
  const current = agentPrivateRecord_(objectId, context.telegramId);
  const values = current ? AGENT_PRIVATE_OBJECT_HEADERS.map((header) => current[header] || "")
    : AGENT_PRIVATE_OBJECT_HEADERS.map(() => "");
  values[headers.object_id - 1] = objectId;
  values[headers.owner_agent_id - 1] = context.telegramId;
  values[headers.documents_json - 1] = JSON.stringify(docs);
  values[headers.updated_at - 1] = new Date();
  const targetRow = current ? current._row : Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(targetRow, 1, 1, AGENT_PRIVATE_OBJECT_HEADERS.length).setValues([values]);
  return { ok: true, document: { id: fileId, name: name, mime_type: mimeType, size: bytes.length, category: category, created_at: metadata.created_at } };
}

function downloadAgentPrivateDocument_(payload) {
  const context = agentPrivateContext_(payload);
  if (!context.ok) return context;
  const objectId = normalizeObjectId_(payload.object_id);
  const ownerId = agentPrivateOwnerId_(objectId);
  if (!ownerId) return { ok: false, error: "object_not_found" };
  const isOwner = ownerId === context.telegramId;
  const grant = isOwner ? null : activeAgentPrivateGrant_(objectId, ownerId, context.telegramId);
  const record = agentPrivateRecord_(objectId, ownerId);
  const doc = agentPrivateDocuments_(record && record.documents_json).find((item) => cleanText_(item.id) === cleanText_(payload.document_id));
  if (!doc) return { ok: false, error: "private_document_not_found" };
  if (!isOwner && (!grant || agentPrivateScopes_(grant.granted_scopes_json).indexOf(doc.category) === -1)) return { ok: false, error: "private_document_access_denied" };
  try {
    const file = DriveApp.getFileById(doc.drive_id);
    const bytes = file.getBlob().getBytes();
    if (!bytes.length || bytes.length > MAX_AGENT_PRIVATE_FILE_BYTES) return { ok: false, error: "private_document_unavailable" };
    return { ok: true, name: doc.name, mime_type: doc.mime_type, file_base64: Utilities.base64Encode(bytes) };
  } catch (_) { return { ok: false, error: "private_document_unavailable" }; }
}


function saveAgentPrivateListingSnapshot_(objectId, ownerAgentId, fields) {
  const sheet = getAgentPrivateObjectsSheet_();
  const headers = ensureHeaders_(sheet, AGENT_PRIVATE_OBJECT_HEADERS);
  const rows = sheetRowsAsObjects_(sheet, AGENT_PRIVATE_OBJECT_HEADERS);
  const existing = rows.find((row) => objectIdsEqual_(row.object_id, objectId)
    && cleanText_(row.owner_agent_id) === cleanText_(ownerAgentId));
  const values = existing
    ? AGENT_PRIVATE_OBJECT_HEADERS.map((header) => existing[header] || "")
    : AGENT_PRIVATE_OBJECT_HEADERS.map(() => "");
  values[headers.object_id - 1] = safeSheetValue_(objectId);
  values[headers.owner_agent_id - 1] = safeSheetValue_(ownerAgentId);
  ["owner_contact_name", "owner_contact_phone", "owner_contact_whatsapp", "legal_status"].forEach((key) => {
    const incoming = cleanText_(fields && fields[key]);
    const limit = key === "legal_status" ? 500 : key === "owner_contact_name" ? 120 : 40;
    if (incoming) values[headers[key] - 1] = safeSheetValue_(incoming.slice(0, limit));
  });
  values[headers.updated_at - 1] = new Date();
  const rowNumber = existing ? existing._row : Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(rowNumber, 1, 1, AGENT_PRIVATE_OBJECT_HEADERS.length).setValues([values]);
}

function privateWhatsappPhone_(value) {
  const raw = cleanText_(value);
  const match = raw.match(/(?:wa\.me\/|whatsapp\.com\/send\?phone=)(\+?\d{9,15})/i);
  const candidate = match ? match[1] : raw;
  const digits = candidate.replace(/\D/g, "");
  return /^[+0-9 ().-]{7,40}$/.test(candidate) && digits.length >= 9 && digits.length <= 15 ? candidate.slice(0, 40) : "";
}

function setupPrivateAgentCrm() {
  getAgentPrivateObjectsSheet_();
  getAgentPrivateAccessSheet_();
  getAgentPrivateFilesFolder_();
  return "Private agent CRM ready; existing listings unchanged";
}

function createWebListing_(payload) {
  if (!emailAuthAuthorized_(payload) || !cleanText_(payload.web_user_id)) return {ok:false,error:"unauthorized"};
  const actor = registeredUserContext_(payload);
  if (!actor.ok) return actor;
  const attempt = cleanText_(payload.submission_id);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attempt)) return {ok:false,error:"invalid_submission_id"};
  const id = "site-" + attempt;
  const input = payload.row || {};
  if (["Аренда","Продажа"].indexOf(input.deal) < 0 || !/^\d+(?:\.\d{1,2})?$/.test(String(input.price)) || !(Number(input.price) > 0) || input.consent !== true
      || !cleanText_(input.address) || !cleanText_(input.object_type) || !cleanText_(input.phone)
      || ["сом","$"].indexOf(input.price_currency) < 0 || ["object","m2"].indexOf(input.price_basis) < 0
      || ["Собственник","Агент"].indexOf(input.poster_type) < 0) return {ok:false,error:"invalid_listing"};
  const decoded = decodeWebListingPhotos_(payload.photos);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {ok:false,error:"submission_busy"};
  try {
    return persistWebListing_(payload, actor, id, input, decoded);
  } finally { lock.releaseLock(); }
}

function persistWebListing_(payload, actor, id, input, decoded) {
    const reservedOwner = listingAgentIdForObject_(id);
    if (reservedOwner && !ownsListingKey_(actor,reservedOwner)) return {ok:false,error:"object_access_denied"};
    const existing = findCatalogRecord_(id);
    if (existing) {
      if (!ownsListingKey_(actor, listingAgentIdForObject_(id))) return {ok:false,error:"object_access_denied"};
      return {ok:true,id:id};
    }
    const urls = storeWebListingPhotos_(id,decoded);
    const row = {id:id, city:"Бишкек", deal:input.deal, segment:input.object_type === "Коммерческая недвижимость" ? "Коммерция" : "Жильё",
      title:cleanText_(input.object_type).slice(0,80), district:cleanText_(input.district).slice(0,160),
      description:cleanText_(input.address).slice(0,160) + "\n" + cleanText_(input.description).slice(0,700),
      price:cleanText_(input.price) + " " + cleanText_(input.price_currency), per:input.price_basis === "m2" ? "м²" : "",
      rooms:cleanText_(input.rooms),area:cleanText_(input.area),floor:cleanText_(input.floor),
      latitude:cleanText_(input.latitude),longitude:cleanText_(input.longitude),
      photo_url:urls.join("|"),status:"на модерации",verified:false,
      created_at:new Date().toISOString(),updated_at:new Date().toISOString(),
      listing_agent_id:actor.telegramId,poster_type:input.poster_type,
      contact_name:actor.name,public_contact_phone:actor.phone,listing_agent_phone:actor.phone,phone:""};
    upsertObjectAgentLink_(row);
    saveAgentPrivateListingSnapshot_(id,actor.telegramId, {owner_contact_name:input.owner_name,owner_contact_phone:input.phone});
    row.contact_privacy_mode = "agent_private_v1";
    upsertObjectFields_(row,PUBLIC_OBJECT_HEADERS);
    return {ok:true,id:id};
}

function decodeWebListingPhotos_(photos) {
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > 5) throw new Error("invalid_photo_count");
  let totalBytes = 0;
  return photos.map(function(photo) {
    if (["image/jpeg","image/png","image/webp"].indexOf(photo.type) < 0 || typeof photo.data !== "string" || photo.data.length > 11200000) throw new Error("invalid_photo");
    const bytes = Utilities.base64Decode(photo.data);
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error("invalid_photo");
    totalBytes += bytes.length;
    if (totalBytes > 24 * 1024 * 1024) throw new Error("photos_too_large");
    const b = function(i) { return bytes[i] & 255; };
    const valid = photo.type === "image/jpeg" ? bytes.length > 4 && b(0) === 255 && b(1) === 216 && b(2) === 255
      : photo.type === "image/png" ? bytes.length > 8 && [137,80,78,71,13,10,26,10].every(function(n,i) {return b(i) === n;})
      : bytes.length > 12 && [82,73,70,70].every(function(n,i) {return b(i) === n;}) && [87,69,66,80].every(function(n,i) {return b(i+8) === n;});
    if (!valid) throw new Error("invalid_photo");
    return Utilities.newBlob(bytes, photo.type);
  });
}

function storeWebListingPhotos_(id,decoded) {
    const props = PropertiesService.getScriptProperties();
    let folderId = props.getProperty("WEB_LISTING_PHOTOS_FOLDER_ID");
    if (!folderId) {
      folderId = DriveApp.createFolder("Liberterra website listing photos").getId();
      props.setProperty("WEB_LISTING_PHOTOS_FOLDER_ID",folderId);
    }
    const folder = DriveApp.getFolderById(folderId);
    return decoded.map(function(blob,index) {
      const name = id + "-" + index;
      const matches = folder.getFilesByName(name);
      const file = matches.hasNext() ? matches.next() : folder.createFile(blob.setName(name));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
      return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1600";
    });
}

function uploadWebListingPhotos_(payload) {
  if (!emailAuthAuthorized_(payload) || !payload.web_user_id) return {ok:false,error:"unauthorized"};
  const actor = registeredUserContext_(payload);
  if (!actor.ok) return actor;
  const objectId = normalizeObjectId_(payload.object_id);
  if (!findCatalogRecord_(objectId) || !ownsListingKey_(actor,listingAgentIdForObject_(objectId))) return {ok:false,error:"object_edit_denied"};
  const decoded = decodeWebListingPhotos_(payload.photos);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {ok:false,error:"submission_busy"};
  try { return {ok:true,urls:storeWebListingPhotos_(objectId + "-" + Utilities.getUuid(),decoded)}; }
  finally {lock.releaseLock();}
}

function ownsListingKey_(actor, ownerKey) {
  const key = cleanText_(ownerKey);
  if (!key || !actor) return false;
  if (typeof actor === "string") return key === actor;
  return key === cleanText_(actor.telegramId) || Boolean(actor.webUserId && key === "web:" + cleanText_(actor.webUserId));
}
