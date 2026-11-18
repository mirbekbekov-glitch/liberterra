// Вставить в crm-workflow-server.gs перед function crmHistoryPage_.
// Плюс одна строка в crmWorkflowAction_ после строки с payload.data.history:
//   if (action === "list_crm_workflow" && payload.data && payload.data.calls !== undefined) return crmClientCalls_(actor, payload.data.calls);

// Звонки клиента из «Мои Звонки» (сервис calls-worker). Адрес и токен лежат только в
// Script Properties: CALLS_API_URL (https://…) и CALLS_API_TOKEN. Браузер их не получает.
// Звонки агента ищутся по email его веб-аккаунта: он должен совпадать с логином в «Мои Звонки».
function crmAgentEmail_(actor) {
  const id = cleanText_(actor.webUserId);
  if (!id) return "";
  const account = passwordAccounts_().find((row) => cleanText_(row.web_user_id) === id);
  return account ? cleanText_(account.Email).toLowerCase() : "";
}

function crmClientCalls_(actor, input) {
  try {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("crm_invalid_fields");
    const clientId = crmString_(input.client_id, 36, true);
    // Права проверяем по записи клиента: чужой client_id даёт crm_client_not_found.
    const client = crmWorkflowRows_(crmWorkflowSheet_(false)).map((row) => row.record)
      .find((record) => record.kind === "client" && record.id === clientId && actor.crmKeys.includes(record.agent_key));
    if (!client) throw Error("crm_client_not_found");
    const page = (status, items) => ({ ok: true, calls_page: { status: status, items: items || [] } });
    const props = PropertiesService.getScriptProperties();
    const base = cleanText_(props.getProperty("CALLS_API_URL")).replace(/\/+$/, ""), token = cleanText_(props.getProperty("CALLS_API_TOKEN"));
    if (!/^https:\/\//.test(base) || !token) return page("not_configured");
    const phone = cleanText_(client.phone), email = crmAgentEmail_(actor);
    if (!phone) return page("no_phone");
    if (!email) return page("no_agent_email");
    let data;
    try {
      const response = UrlFetchApp.fetch(base + "/api/calls?limit=50&agent=" + encodeURIComponent(email) + "&client_phone=" + encodeURIComponent(phone),
        { method: "get", headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) return page("unavailable");
      data = JSON.parse(response.getContentText());
    } catch (_) { return page("unavailable"); }
    // Явная проекция: ссылка на запись наружу не уходит, только признак has_recording.
    return page("ok", (Array.isArray(data.results) ? data.results : []).slice(0, 50).map((call) => ({
      id: cleanText_(call.id), direction: call.direction === "out" ? "out" : "in", answered: Number(call.answered) === 1,
      started_at: Number(call.start_time) > 0 ? new Date(Number(call.start_time) * 1000).toISOString() : "",
      duration: Math.max(0, Math.floor(Number(call.duration) || 0)), has_recording: call.has_recording === true })));
  } catch (error) { return { ok: false, error: /^crm_/.test(error.message) ? error.message : "crm_storage_error" }; }
}
