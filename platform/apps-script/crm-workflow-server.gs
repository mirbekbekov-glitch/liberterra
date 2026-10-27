const AGENT_TASKS_SHEET_NAME = "Agent Tasks";
const AGENT_TASK_HEADERS = ["task_id", "agent_key", "title", "object_id", "due_at", "status", "created_at", "updated_at", "client_id"];
function getAgentTasksSheet_() {
  const book = getAgentPrivateBook_();
  const sheet = book.getSheetByName(AGENT_TASKS_SHEET_NAME) || book.insertSheet(AGENT_TASKS_SHEET_NAME);
  ensureHeaders_(sheet, AGENT_TASK_HEADERS);
  return sheet;
}
function agentTasksAction_(payload, action) {
  const context = crmWorkflowContext_(payload);
  if (!context.ok) return context;
  const agentKey = context.crmKey;
  if (!agentKey) return { ok: false, error: "agent_identity_required" };
  if (action === "list_agent_tasks") {
    const tasks = sheetRowsAsObjects_(getAgentTasksSheet_(), AGENT_TASK_HEADERS)
      .filter((row) => context.crmKeys.includes(row.agent_key))
      .map((row) => ({ task_id: row.task_id, title: row.title, object_id: row.object_id,
        due_at: row.due_at, status: row.status, created_at: row.created_at, updated_at: row.updated_at, client_id: row.client_id || "" }));
    return { ok: true, tasks: tasks };
  }
  const taskId = cleanText_(payload.task_id);
  if (!/^[0-9a-f-]{36}$/i.test(taskId)) return { ok: false, error: "invalid_task_id" };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: "task_busy" };
  try {
    const sheet = getAgentTasksSheet_();
    const rows = sheetRowsAsObjects_(sheet, AGENT_TASK_HEADERS);
    const existing = rows.find((row) => row.task_id === taskId);
    if (existing && !context.crmKeys.includes(existing.agent_key)) return { ok: false, error: "task_access_denied" };
    const now = new Date();
    if (existing) {
      if (!cleanText_(payload.status) && cleanText_(payload.title) === existing.title) {
        return { ok: true, task_id: taskId, status: existing.status };
      }
      if (!["open", "done"].includes(cleanText_(payload.status))) return { ok: false, error: "invalid_task_status" };
      const headers = ensureHeaders_(sheet, AGENT_TASK_HEADERS);
      sheet.getRange(existing._row, headers.status).setValue(cleanText_(payload.status));
      sheet.getRange(existing._row, headers.updated_at).setValue(now);
      return { ok: true, task_id: taskId, status: cleanText_(payload.status) };
    }
    const title = cleanText_(payload.title);
    const objectId = normalizeObjectId_(payload.object_id);
    const dueAt = cleanText_(payload.due_at);
    const clientId = cleanText_(payload.client_id);
    if (clientId && !crmClientOwned_(context, clientId)) return { ok: false, error: "crm_client_not_found" };
    if (!title || title.length > 180) return { ok: false, error: "invalid_task_title" };
    if (dueAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dueAt) || isNaN(new Date(dueAt).getTime()))) return { ok: false, error: "invalid_task_due_at" };
    if (objectId && !ownObjectIds_(context).some((id) => objectIdsEqual_(id, objectId)) && !isPublicCrmObject_(getObjectRecordById_(objectId))) return { ok: false, error: "object_access_denied" };
    if (rows.filter((row) => context.crmKeys.includes(row.agent_key) && row.status === "open").length >= 200) return { ok: false, error: "task_limit_reached" };
    const values = [safeSheetValue_(taskId), safeSheetValue_(agentKey), safeSheetValue_(title), safeSheetValue_(objectId), safeSheetValue_(dueAt), "open", now, now, safeSheetValue_(clientId)];
    const headers = ensureHeaders_(sheet, AGENT_TASK_HEADERS), cells = new Array(sheet.getLastColumn()).fill("");
    AGENT_TASK_HEADERS.forEach((header, index) => { cells[headers[header] - 1] = values[index]; });
    sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, 1, cells.length).setValues([cells]);
    return { ok: true, task_id: taskId, status: "open" };
  } finally { lock.releaseLock(); }
}
// Deploy beside google_sheets_webhook.gs. All workflow records live in the private CRM book.
const CRM_WORKFLOW_HEADERS = ["id", "kind", "agent_key", "record_json"];
const CRM_STAGES = ["new", "selection", "viewing", "negotiation", "won", "lost"];

function crmWorkflowContext_(payload) {
  const registered = registeredUserContext_(payload);
  if (!registered.ok) return registered;
  const actor = approvedAgentContext_(payload, registered);
  if (!actor.ok) return actor;
  const key = cleanText_(actor.telegramId);
  if (!key) return { ok: false, error: "agent_identity_required" };
  const keys = [key];
  if (actor.webUserId) keys.push("web:" + actor.webUserId);
  // Only server-verified account links may grant access to pre-link records.
  if (!key.startsWith("web:")) passwordAccounts_().forEach((account) => {
    if (cleanText_(account.telegram_id) === key && account._account_type === "Агент" && passwordAccountActive_(account, "Агент") && cleanText_(account.web_user_id)) {
      keys.push("web:" + cleanText_(account.web_user_id));
    }
  });
  return Object.assign({}, actor, { crmKey: key, crmKeys: Array.from(new Set(keys)) });
}

function crmWorkflowSheet_(create) {
  const id = PropertiesService.getScriptProperties().getProperty("AGENT_PRIVATE_SPREADSHEET_ID");
  if (!id && !create) return null;
  const book = getAgentPrivateBook_();
  let sheet = book.getSheetByName("CRM Workflow");
  if (!sheet && create) sheet = book.insertSheet("CRM Workflow");
  if (sheet && create) ensureHeaders_(sheet, CRM_WORKFLOW_HEADERS);
  return sheet;
}

function crmWorkflowRows_(sheet) {
  if (!sheet) return [];
  return sheetRowsAsObjects_(sheet, CRM_WORKFLOW_HEADERS).map((row) => {
    const record = JSON.parse(row.record_json);
    if (record.id !== row.id || record.kind !== row.kind || record.agent_key !== row.agent_key) throw Error("crm_storage_error");
    return { row: row._row, record: record };
  });
}

function crmPublicRecord_(record) {
  const result = Object.assign({}, record);
  delete result.agent_key;
  delete result.mutation_id;
  return result;
}

function crmString_(value, limit, required) {
  const text = cleanText_(value);
  if ((required && !text) || text.length > limit) throw Error("crm_invalid_fields");
  return text;
}

function crmNumber_(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1e12) throw Error("crm_invalid_budget");
  return number;
}

function crmNormalizeRecord_(kind, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw Error("crm_invalid_fields");
  if (kind === "object_stage") {
    if (!CRM_STAGES.includes(data.stage)) throw Error("crm_invalid_fields");
    return { object_id: crmString_(data.object_id, 100, true), stage: data.stage };
  }
  if (kind === "client") {
    const role = crmString_(data.role, 20, true), stage = crmString_(data.stage, 20, true);
    if (!["buyer", "tenant", "owner"].includes(role) || !CRM_STAGES.includes(stage)) throw Error("crm_invalid_fields");
    const currency = crmString_(data.currency, 3, true);
    if (!["USD", "KGS"].includes(currency)) throw Error("crm_invalid_fields");
    const min = crmNumber_(data.budget_min), max = crmNumber_(data.budget_max);
    if (min !== "" && max !== "" && min > max) throw Error("crm_invalid_budget");
    const phone = crmString_(data.phone, 40, false);
    if (phone && !/^\+?[0-9 ()-]{7,40}$/.test(phone)) throw Error("crm_invalid_phone");
    return { name: crmString_(data.name, 120, true), phone: phone, role: role, stage: stage,
      city: crmString_(data.city, 100, false), district: crmString_(data.district, 200, false),
      property_type: crmString_(data.property_type, 100, false), rooms: crmString_(data.rooms, 40, false),
      budget_min: min, budget_max: max, currency: currency, notes: crmString_(data.notes, 2000, false) };
  }
  if (kind === "selection") {
    if (!Array.isArray(data.object_ids) || data.object_ids.length > 50) throw Error("crm_invalid_objects");
    const ids = Array.from(new Set(data.object_ids.map(normalizeObjectId_)));
    if (!ids.length || ids.some((id) => !id || id.length > 100)) throw Error("crm_invalid_objects");
    return { title: crmString_(data.title, 120, true), client_id: crmString_(data.client_id, 36, true), object_ids: ids };
  }
  if (kind === "appointment") {
    const date = crmString_(data.starts_at, 30, true), status = crmString_(data.status, 20, true);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString() !== date) throw Error("crm_invalid_date");
    if (!["planned", "completed", "cancelled"].includes(status)) throw Error("crm_invalid_fields");
    if (status === "completed" && Date.parse(date) > Date.now()) throw Error("crm_showing_too_early");
    return { client_id: crmString_(data.client_id, 36, true), object_id: crmString_(data.object_id, 100, true),
      starts_at: date, status: status, notes: crmString_(data.notes, 1000, false) };
  }
  throw Error("crm_invalid_kind");
}

function crmWorkflowAction_(payload, action) {
  const actor = crmWorkflowContext_(payload);
  if (!actor.ok) return actor;
  if (action === "list_crm_workflow") {
    try {
      const records = crmWorkflowRows_(crmWorkflowSheet_(false)).map((row) => row.record)
        .filter((record) => actor.crmKeys.includes(record.agent_key)).map(crmPublicRecord_);
      const catalog = catalogRows_(), links = objectAgentLinks_();
      const fields = ["id", "title", "city", "district", "price", "per", "area", "rooms", "deal", "status", "actuality_at"];
      const objects = objectRows_(catalog).filter((object) => isPublicCrmObject_(object) || ownsListingKey_(actor, listingAgentIdForObject_(object.id, links)))
        .map((object) => fields.reduce((safe, key) => { safe[key] = cleanText_(object[key]); return safe; }, { own: ownsListingKey_(actor, listingAgentIdForObject_(object.id, links)) }));
      return { ok: true, records: records, objects: objects, requests: crmRequestFeed_(actor, catalog), specialization: actor.specialization };
    } catch (_) { return { ok: false, error: "crm_storage_error" }; }
  }
  if (action !== "save_crm_record") return { ok: false, error: "unknown_action" };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleanText_(payload.id))
      || !/^[0-9a-f-]{36}$/i.test(cleanText_(payload.mutation_id))) return { ok: false, error: "crm_invalid_id" };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: "crm_busy" };
  try {
    const sheet = crmWorkflowSheet_(true), rows = crmWorkflowRows_(sheet);
    const found = rows.find((row) => row.record.id === payload.id), existing = found && found.record;
    if (existing && (!actor.crmKeys.includes(existing.agent_key) || existing.kind !== payload.kind)) throw Error("crm_not_found");
    if (existing && existing.mutation_id === payload.mutation_id) return { ok: true, record: crmPublicRecord_(existing) };
    if (Number(payload.version) !== (existing ? existing.version : 0)) throw Error("crm_version_conflict");
    let data = crmNormalizeRecord_(payload.kind, payload.data);
    const sourceId = crmString_(existing ? existing.source_request_id : payload.data.source_request_id, 100, false);
    if (payload.kind === "client" && sourceId) {
      if (!existing) {
        const source = crmRequestFeed_(actor, catalogRows_()).find((request) => request.id === sourceId);
        if (!source) throw Error("crm_request_unavailable");
        const prior = rows.find((row) => row.record.kind === "client" && row.record.source_request_id === sourceId && actor.crmKeys.includes(row.record.agent_key));
        if (prior) return { ok: true, record: crmPublicRecord_(prior.record), already_imported: true };
      }
      data.source_request_id = sourceId;
    }
    if (payload.kind === "object_stage") {
      const prior = rows.find((row) => row.record.kind === "object_stage" && row.record.object_id === data.object_id && actor.crmKeys.includes(row.record.agent_key));
      if (prior && (!existing || prior.record.id !== existing.id)) throw Error("crm_version_conflict");
    }
    if (data.client_id && !rows.some((row) => row.record.kind === "client" && row.record.id === data.client_id && actor.crmKeys.includes(row.record.agent_key))) throw Error("crm_client_not_found");
    const objectIds = data.object_ids || (data.object_id ? [data.object_id] : []);
    if (objectIds.length) {
      const catalog = catalogRows_(), links = objectAgentLinks_();
      objectIds.forEach((id) => {
        const object = getObjectRecordById_(id, catalog);
        if (payload.kind === "object_stage" && (!object || cleanText_(object.deal).toLowerCase() === "запрос" || !ownsListingKey_(actor, listingAgentIdForObject_(id, links)))) throw Error("crm_object_unavailable");
        if (!object || (!isPublicCrmObject_(object) && !ownsListingKey_(actor, listingAgentIdForObject_(id, links)))) throw Error("crm_object_unavailable");
      });
    }
    const owned = rows.filter((row) => actor.crmKeys.includes(row.record.agent_key));
    if (!existing && owned.length >= 3000) throw Error("crm_limit_reached");
    const now = new Date().toISOString();
    const record = Object.assign({}, data, { id: payload.id, kind: payload.kind, agent_key: existing ? existing.agent_key : actor.crmKey,
      version: existing ? existing.version + 1 : 1, created_at: existing ? existing.created_at : now, updated_at: now, mutation_id: payload.mutation_id });
    if (payload.kind === "selection") {
      const enabled = payload.share_enabled === undefined ? Boolean(existing && existing.share_enabled) : payload.share_enabled === true;
      record.share_enabled = enabled;
      record.share_token = enabled ? (existing && existing.share_enabled && existing.share_token || (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "")) : "";
    }
    const values = [record.id, record.kind, safeSheetValue_(record.agent_key), JSON.stringify(record)];
    const headers = ensureHeaders_(sheet, CRM_WORKFLOW_HEADERS);
    const rowNumber = found ? found.row : Math.max(sheet.getLastRow() + 1, 2);
    // Write the complete record and its version together; preserve other columns.
    const cells = found ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0] : new Array(sheet.getLastColumn()).fill("");
    CRM_WORKFLOW_HEADERS.forEach((header, index) => { cells[headers[header] - 1] = values[index]; });
    sheet.getRange(rowNumber, 1, 1, cells.length).setValues([cells]);
    SpreadsheetApp.flush();
    const saved = JSON.parse(sheet.getRange(rowNumber, headers.record_json).getValue());
    if (saved.mutation_id !== payload.mutation_id || saved.version !== record.version) throw Error("crm_save_unconfirmed");
    return { ok: true, record: crmPublicRecord_(saved) };
  } catch (error) {
    return { ok: false, error: /^crm_/.test(error.message) ? error.message : "crm_storage_error" };
  } finally { lock.releaseLock(); }
}

// Published requests are shared intake; CRM contacts and stages remain agent-private.
function crmRequestDirection_(request) {
  const explicit = cleanText_(request.request_deal || request.request_type).toLowerCase();
  if (["sale", "покупка", "продажа", "купить"].includes(explicit)) return "sale";
  if (["rent", "аренда", "снять"].includes(explicit)) return "rent";
  const title = cleanText_(request.title).toLowerCase().replace(/ё/g, "е");
  if (/^(куплю|купить|покупка)\b/.test(title) || /^(куплю|купить|покупка)(?:\s|:|$)/.test(title)) return "sale";
  if (/^(сниму|снять|аренда)(?:\s|:|$)/.test(title)) return "rent";
  if (/мес|сут|день/.test(cleanText_(request.per).toLowerCase())) return "rent";
  return "";
}

function crmRequestFeed_(actor, catalog) {
  const direction = normalizeAgentSpecialization_(actor.specialization);
  if (!direction) return [];
  const fields = ["id", "title", "contact_name", "phone", "city", "district", "rooms", "price", "description", "created_at", "updated_at", "status"];
  return requestRows_(catalog).filter(isPublicCrmObject_)
    .filter((row) => !crmRequestDirection_(row) || crmRequestDirection_(row) === direction)
    .map((row) => fields.reduce((safe, key) => { safe[key] = key === "phone" ? crmRequestPublicPhone_(row) : cleanText_(row[key]); return safe; }, { direction: crmRequestDirection_(row) }))
    .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0));
}

function crmRequestPublicPhone_(row) {
  // Only explicit public contact or consent-backed website request contacts.
  const phone = cleanText_(row.public_contact_phone || (/^web-[0-9a-f]{8}$/i.test(cleanText_(row.id)) ? row.phone : ""));
  return /^\+?[0-9 ()-]{7,40}$/.test(phone) ? phone : "";
}

function getPublicCrmSelection_(payload) {
  const token = cleanText_(payload.token);
  if (!/^[0-9a-f]{64}$/i.test(token)) return { ok: false, error: "selection_unavailable" };
  try {
    const found = crmWorkflowRows_(crmWorkflowSheet_(false)).map((row) => row.record)
      .find((record) => record.kind === "selection" && record.share_enabled && record.share_token === token);
    if (!found) return { ok: false, error: "selection_unavailable" };
    const catalog = catalogRows_();
    // Explicit allowlist: no client name/phone, notes, owners, commissions, documents or private titles.
    const fields = ["id", "title", "city", "district", "price", "per", "area", "rooms", "floor", "photo_url", "actuality_at"];
    const objects = found.object_ids.map((id) => getObjectRecordById_(id, catalog)).filter(isPublicCrmObject_)
      .map((object) => fields.reduce((safe, key) => { safe[key] = cleanText_(object[key]); return safe; }, {}));
    return { ok: true, objects: objects, unavailable_count: found.object_ids.length - objects.length, updated_at: found.updated_at };
  } catch (_) { return { ok: false, error: "selection_unavailable" }; }
}

function crmClientOwned_(actor, clientId) {
  return crmWorkflowRows_(crmWorkflowSheet_(false)).some((row) => row.record.kind === "client" && row.record.id === clientId && actor.crmKeys.includes(row.record.agent_key));
}
