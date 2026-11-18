// Consent-backed service enquiries. Stored only in the private workbook.
const SERVICE_REQUEST_HEADERS = ["id", "user_key", "record_json"];
function serviceRequestAction_(payload) {
  if (payload.data && payload.data.kind === "agent_assignment") return agentAssignmentAction_(payload);
  const actor = registeredUserContext_(payload);
  if (!actor.ok) return actor;
  const key = actor.webUserId ? "web:" + cleanText_(actor.webUserId) : cleanText_(actor.telegramId);
  if (!key) return { ok: false, error: "registration_required" };
  const book = getAgentPrivateBook_();
  let sheet = book.getSheetByName("Service Requests");
  const readRows = () => sheet ? sheetRowsAsObjects_(sheet, SERVICE_REQUEST_HEADERS).map((row) => {
    try { return { row: row, record: JSON.parse(row.record_json) }; } catch (_) { return null; }
  }).filter(Boolean) : [];
  if (payload.action === "list_service_requests") {
    const requestedKind = cleanText_(payload.data && payload.data.kind);
    if (requestedKind && !["legal_check", "mortgage", "object_inquiry"].includes(requestedKind)) return { ok: false, error: "invalid_service_kind" };
    return { ok: true, requests: readRows().filter((item) => (item.row.user_key === key || actor.isAdmin === true) && (!requestedKind || item.record.kind === requestedKind)).map((item) => item.record) };
  }
  if (payload.action !== "create_service_request") return { ok: false, error: "unsupported_action" };
  const id = cleanText_(payload.id), data = payload.data || {};
  if (!/^[0-9a-f-]{36}$/i.test(id) || data.consent !== true || !["legal_check", "mortgage", "object_inquiry"].includes(data.kind)) return { ok: false, error: "invalid_service_request" };
  if (data.kind === "object_inquiry" && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return { ok: false, error: "invalid_service_request" };
  const name = cleanText_(data.name), phone = cleanText_(data.phone);
  if (!name || name.length > 120 || !/^\+?[0-9 ()-]{7,40}$/.test(phone)) return { ok: false, error: "invalid_service_fields" };
  let fields;
  if (data.kind === "object_inquiry") {
    const objectId = normalizeObjectId_(data.object_id), object = getObjectRecordById_(objectId, catalogRows_());
    const note = cleanText_(data.note);
    if (!object || !isPublicCrmObject_(object) || cleanText_(object.deal).toLowerCase() === "запрос" || note.length > 1000) return { ok: false, error: "object_inquiry_unavailable" };
    fields = { object_id: objectId, note: note };
  } else if (data.kind === "legal_check") {
    const address = cleanText_(data.address);
    if (!address || address.length > 1000 || !["client", "agent"].includes(data.requester_type) || !["apartment", "house", "commercial"].includes(data.property_type)) return { ok: false, error: "invalid_service_fields" };
    fields = { address: address, requester_type: data.requester_type, property_type: data.property_type };
  } else {
    const text = (value, max) => { const result = cleanText_(value); return result.length <= max ? result : ""; };
    const number = (value, min, max) => { const n = Number(value); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
    const city = text(data.city, 120), price = number(data.property_price, 1, 10000000000);
    const down = number(data.down_payment, 0, 10000000000), income = number(data.monthly_income, 1, 1000000000);
    const term = number(data.term_years, 1, 30), adults = number(data.adults, 1, 20), children = number(data.children, 0, 20);
    const existing = number(data.existing_loan_payment || 0, 0, 1000000000);
    if (!city || price === null || down === null || down >= price || income === null || term === null || !Number.isInteger(term) || adults === null || !Number.isInteger(adults) || children === null || !Number.isInteger(children) || existing === null) return { ok: false, error: "invalid_mortgage_fields" };
    if (!["KGS", "USD"].includes(data.currency) || !["apartment", "house", "land", "commercial", "undecided"].includes(data.property_type) || !["employed", "self_employed", "business", "other"].includes(data.employment) || !["single", "married", "divorced", "widowed"].includes(data.marital_status) || !["no_history", "good", "late_payments", "current_arrears", "unsure"].includes(data.credit_history) || !["yes", "no", "unsure"].includes(data.co_borrower)) return { ok: false, error: "invalid_mortgage_fields" };
    fields = { city: city, property_type: data.property_type, property_price: price, down_payment: down,
      currency: data.currency, monthly_income: income, income_currency: data.income_currency,
      term_years: term, employment: data.employment, marital_status: data.marital_status,
      adults: adults, children: children, existing_loan_payment: existing,
      credit_history: data.credit_history, co_borrower: data.co_borrower,
      purchase_timing: text(data.purchase_timing, 80), note: text(data.note, 1000) };
    if (!["KGS", "USD"].includes(data.income_currency) || (data.purchase_timing && !fields.purchase_timing) || (data.note && !fields.note)) return { ok: false, error: "invalid_mortgage_fields" };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: "service_busy" };
  try {
    const rows = readRows(), existing = rows.find((item) => item.record.id === id);
    if (existing) return existing.row.user_key === key ? { ok: true, request: existing.record, duplicate: true } : { ok: false, error: "service_access_denied" };
    if (data.kind === "object_inquiry") {
      const prior = rows.find((item) => item.row.user_key === key && item.record.kind === "object_inquiry"
        && item.record.object_id === fields.object_id && item.record.status === "pending"
        && Date.now() - Date.parse(item.record.created_at) < 86400000);
      if (prior) return { ok: true, request: prior.record, duplicate: true };
    }
    if (rows.filter((item) => item.row.user_key === key && item.record.status === "pending").length >= 20) return { ok: false, error: "service_limit_reached" };
    if (!sheet) sheet = book.insertSheet("Service Requests");
    const headers = ensureHeaders_(sheet, SERVICE_REQUEST_HEADERS), now = new Date().toISOString();
    const record = { id: id, kind: data.kind, name: name, phone: phone, ...fields,
      consent_at: now, consent_version: data.kind === "mortgage" ? "mortgage-intake-v1" : data.kind === "object_inquiry" ? "object-inquiry-v1" : "legal-check-v1", created_at: now, status: "pending" };
    const cells = new Array(sheet.getLastColumn()).fill("");
    cells[headers.id - 1] = safeSheetValue_(id); cells[headers.user_key - 1] = safeSheetValue_(key); cells[headers.record_json - 1] = JSON.stringify(record);
    sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, 1, cells.length).setValues([cells]);
    return { ok: true, request: record };
  } finally { lock.releaseLock(); }
}

// Only approved CRM agents receive the contact fields of consented object enquiries.
function crmObjectInquiryFeed_(actor, catalog) {
  const direction = normalizeAgentSpecialization_(actor.specialization);
  if (!direction) return [];
  const sheet = getAgentPrivateBook_().getSheetByName("Service Requests");
  if (!sheet) return [];
  return sheetRowsAsObjects_(sheet, SERVICE_REQUEST_HEADERS).map((row) => {
    try {
      const record = JSON.parse(row.record_json);
      if (record.kind !== "object_inquiry" || record.status !== "pending" || !record.consent_at) return null;
      const object = getObjectRecordById_(normalizeObjectId_(record.object_id), catalog);
      if (!object || !isPublicCrmObject_(object)) return null;
      const deal = cleanText_(object.deal).toLowerCase();
      const objectDirection = /аренд|rent/.test(deal) ? "rent" : /продаж|sale/.test(deal) ? "sale" : "";
      if (objectDirection !== direction) return null;
      return { id: "inquiry:" + record.id, direction: objectDirection, object_id: cleanText_(object.id),
        title: "Обращение по объекту: " + cleanText_(object.title).slice(0, 120),
        contact_name: cleanText_(record.name), phone: cleanText_(record.phone), city: cleanText_(object.city),
        district: cleanText_(object.district), rooms: cleanText_(object.rooms), price: "",
        description: cleanText_(record.note), created_at: cleanText_(record.created_at), updated_at: cleanText_(record.created_at), status: "pending" };
    } catch (_) { return null; }
  }).filter(Boolean);
}

// Assignment is a consented work request, not a transfer of listing ownership or documents.
function agentAssignmentAction_(payload) {
  const actor = registeredUserContext_(payload);
  if (!actor.ok) return actor;
  const actorId = cleanText_(actor.telegramId);
  if (!actorId) return {ok:false,error:"registration_required"};
  const data = payload.data || {}, book = getAgentPrivateBook_();
  let sheet = book.getSheetByName("Agent Assignments");
  const headers = ["id", "record_json"];
  const rows = () => sheet ? sheetRowsAsObjects_(sheet,headers).map(row => {
    try { return {row:row,record:JSON.parse(row.record_json)}; } catch (_) { return null; }
  }).filter(Boolean) : [];
  const approved = approvedAgentContext_(payload, actor);
  const recipient = record => approved.ok === true && cleanText_(approved.telegramId) === record.agent_id;
  const visible = record => record.owner_id === actorId || recipient(record);
  const project = record => ({id:record.id,object_id:record.object_id,agent_ref:record.agent_ref,agent_name:record.agent_name,
    name:record.name,phone:record.phone,address:record.address,status:record.status,version:record.version,
    created_at:record.created_at,updated_at:record.updated_at,consent_at:record.consent_at,
    side:record.owner_id === actorId ? "owner" : "agent"});
  if (payload.action === "list_service_requests") return {ok:true,requests:rows().filter(item=>visible(item.record)).map(item=>project(item.record))};
  if (payload.action !== "create_service_request") return {ok:false,error:"unsupported_action"};
  const id=cleanText_(payload.id), operation=cleanText_(data.operation || "create"), mutation=cleanText_(data.mutation_id);
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(id) || !uuid.test(mutation)) return {ok:false,error:"invalid_assignment_id"};
  const lock=LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:"assignment_busy"};
  try {
    const all=rows(), existing=all.find(item=>item.record.id===id);
    let record, rowNumber;
    if (operation === "create") {
      if (existing) {
        if (existing.record.owner_id!==actorId) return {ok:false,error:"assignment_access_denied"};
        if (existing.record.object_id!==normalizeObjectId_(data.object_id) || existing.record.agent_ref!==cleanText_(data.agent_ref)) return {ok:false,error:"assignment_conflict"};
        return {ok:true,request:project(existing.record),duplicate:true};
      }
      const objectId=normalizeObjectId_(data.object_id), object=findCatalogRecord_(objectId);
      if (!object || object.kind!=="object" || !ownsListingKey_(actor,listingAgentIdForObject_(objectId))) return {ok:false,error:"object_access_denied"};
      if (data.consent!==true) return {ok:false,error:"assignment_consent_required"};
      const agent=agentByPublicRef_(data.agent_ref);
      if (!agent || agent.telegram_id===actorId) return {ok:false,error:"invalid_assignment_agent"};
      if (all.some(item=>item.record.object_id===objectId && ["pending","accepted"].includes(item.record.status))) return {ok:false,error:"assignment_already_exists"};
      const name=cleanText_(data.name),phone=cleanText_(data.phone);
      if (!name || name.length>120 || !/^\+?[0-9 ()-]{7,40}$/.test(phone)) return {ok:false,error:"invalid_assignment_contact"};
      if (all.filter(item=>item.record.owner_id===actorId && item.record.status==="pending").length>=20) return {ok:false,error:"assignment_limit_reached"};
      const now=new Date().toISOString();
      record={id:id,object_id:objectId,owner_id:actorId,agent_id:agent.telegram_id,agent_ref:agent.public_ref,agent_name:agent.name,
        name:name,phone:phone,address:cleanText_(object.row.description || object.row.title).slice(0,1000),status:"pending",version:1,
        consent_at:now,consent_version:"agent-assignment-v1",created_at:now,updated_at:now,
        history:[{operation:"create",actor_id:actorId,mutation_id:mutation,at:now}]};
    } else {
      if (!existing || !visible(existing.record)) return {ok:false,error:"assignment_access_denied"};
      record=existing.record;rowNumber=existing.row._row;
      if ((record.history||[]).some(event=>event.mutation_id===mutation && event.actor_id===actorId && event.operation===operation)) return {ok:true,request:project(record),duplicate:true};
      if (Number(data.version)!==record.version) return {ok:false,error:"assignment_version_conflict"};
      if (operation==="cancel") {
        if (record.owner_id!==actorId || !["pending","accepted"].includes(record.status)) return {ok:false,error:"assignment_transition_denied"};
      } else if (!["accept","decline"].includes(operation) || !recipient(record) || record.status!=="pending") return {ok:false,error:"assignment_transition_denied"};
      record.status={accept:"accepted",decline:"declined",cancel:"cancelled"}[operation];
      record.version++;record.updated_at=new Date().toISOString();
      record.history.push({operation:operation,actor_id:actorId,mutation_id:mutation,at:record.updated_at});
    }
    if (!sheet) sheet=book.insertSheet("Agent Assignments");
    const map=ensureHeaders_(sheet,headers),cells=new Array(sheet.getLastColumn()).fill("");
    cells[map.id-1]=safeSheetValue_(id);cells[map.record_json-1]=JSON.stringify(record);
    sheet.getRange(rowNumber || Math.max(sheet.getLastRow()+1,2),1,1,cells.length).setValues([cells]);
    return {ok:true,request:project(record)};
  } finally {lock.releaseLock();}
}
