// Admin-managed public resources. Stored in the existing private CRM workbook.
// Public reads project an explicit allowlist; private CRM rows never leave this function.
function crmResourceFields_(kind) {
  const common = ["name", "description", "website", "published", "verified"];
  if (kind === "partner") return common.concat(["category", "city", "districts", "phone", "whatsapp", "logo"]);
  if (kind === "agency") return common.concat(["city", "phone", "logo"]);
  if (kind === "document_template") return common.concat(["file_url", "format"]);
  if (kind === "bank_offer") return common.concat(["rate", "term_years", "down_payment", "source_date"]);
  throw Error("crm_invalid_kind");
}
function crmHttpsUrl_(value, required) {
  const url = crmString_(value, 1000, required);
  if (url && (!/^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?(?:[/?#][^\s]*)?$/i.test(url) || url.indexOf('\\') !== -1)) throw Error("crm_invalid_url");
  return url;
}
function crmNormalizeResource_(kind, data) {
  const result = { name: crmString_(data.name, 160, true), description: crmString_(data.description, 2000, false),
    website: crmHttpsUrl_(data.website, false), published: data.published === true, verified: data.verified === true };
  if (kind === "partner") {
    if (!["cleaning", "repair", "handyman", "legal", "accounting"].includes(data.category)) throw Error("crm_invalid_fields");
    result.category = data.category; result.districts = crmString_(data.districts, 300, false); result.whatsapp = crmString_(data.whatsapp, 40, false);
  }
  if (["partner", "agency"].includes(kind)) {
    result.city = crmString_(data.city, 100, false); result.phone = crmString_(data.phone, 40, false); result.logo = crmHttpsUrl_(data.logo, false);
  }
  if (kind === "document_template") {
    result.file_url = crmHttpsUrl_(data.file_url, true); result.format = crmString_(data.format, 10, true);
    if (!["PDF", "DOCX"].includes(result.format)) throw Error("crm_invalid_fields");
  }
  if (kind === "bank_offer") {
    result.rate = crmNumber_(data.rate); result.term_years = crmNumber_(data.term_years); result.down_payment = crmNumber_(data.down_payment);
    if (result.rate === "" || result.rate > 100 || !(result.term_years > 0 && result.term_years <= 50) || result.down_payment === "" || result.down_payment > 100) throw Error("crm_invalid_fields");
    result.source_date = crmString_(data.source_date, 10, true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(result.source_date) || !Number.isFinite(Date.parse(result.source_date)) || !result.website) throw Error("crm_invalid_fields");
  }
  return result;
}
function crmPublicResources_(payload) {
  try {
    const kind = cleanText_(payload.kind), fields = crmResourceFields_(kind);
    const items = crmWorkflowRows_(crmWorkflowSheet_(false)).map(row => row.record)
      .filter(record => record.kind === kind && record.published === true)
      .map(record => fields.reduce((safe, field) => { safe[field] = record[field]; return safe; }, { id: record.id, updated_at: record.updated_at }));
    return { ok: true, items: items };
  } catch (error) { return { ok: false, error: error.message === "crm_invalid_kind" ? error.message : "crm_storage_error" }; }
}
