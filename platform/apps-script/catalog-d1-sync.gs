// Public catalogue mirror. Sheets remains authoritative; no source rows are changed.
const D1_CATALOG_PRIVATE_HEADERS = PRIVATE_CONTRACT_HEADERS.concat(["phone"]);

function buildPublicCatalogD1Snapshot_() {
  SpreadsheetApp.flush();
  const headers = PUBLIC_OBJECT_HEADERS.filter((header) => D1_CATALOG_PRIVATE_HEADERS.indexOf(header) === -1);
  const records = catalogRows_(true);
  const ids = records.map((record) => normalizeObjectId_(record.id));
  if (!records.length || ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    throw new Error("catalog_snapshot_invalid_ids");
  }
  const csv = [headers.map(catalogCsvCell_).join(",")]
    .concat(records.map((record) => headers.map((header) => catalogCsvCell_(record[header])).join(",")))
    .join("\r\n");
  const sha256 = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, csv, Utilities.Charset.UTF_8));
  const counts = {};
  records.forEach((record) => {
    const key = cleanText_(record.deal) + " / " + cleanText_(record.status);
    counts[key] = (counts[key] || 0) + 1;
  });
  return { csv: csv, sha256: sha256, row_count: records.length, counts: counts };
}

function syncPublicCatalogSnapshotToD1_(force) {
  const properties = PropertiesService.getScriptProperties();
  if (!force && properties.getProperty("CATALOG_D1_SYNC_ENABLED") !== "true") {
    return { ok: true, skipped: true };
  }
  try {
    const token = cleanText_(properties.getProperty("BOT_TOKEN"));
    if (!token) throw new Error("catalog_sync_bot_token_missing");
    const snapshot = buildPublicCatalogD1Snapshot_();
    const timestamp = Math.floor(Date.now() / 1000);
    const canonical = "catalog_snapshot_sync\n" + timestamp + "\n" + snapshot.sha256;
    const signature = bytesToHex_(Utilities.computeHmacSha256Signature(canonical, token, Utilities.Charset.UTF_8));
    const response = UrlFetchApp.fetch("https://liberterra.kg/api/catalog-sync", {
      method: "post", contentType: "application/json",
      payload: JSON.stringify({ timestamp: timestamp, sha256: snapshot.sha256, signature: signature, row_count: snapshot.row_count, csv: snapshot.csv }),
      muteHttpExceptions: true,
    });
    let result;
    try { result = JSON.parse(response.getContentText() || "{}"); } catch (_) { result = {}; }
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300 || result.ok !== true) {
      throw new Error("catalog_sync_failed:" + cleanText_(result.error || response.getResponseCode()));
    }
    properties.setProperties({ CATALOG_D1_LAST_SUCCESS_AT: String(result.generated_at_ms), CATALOG_D1_LAST_SHA256: snapshot.sha256, CATALOG_D1_LAST_ERROR: "" });
    return { ok: true, row_count: snapshot.row_count, generated_at_ms: result.generated_at_ms, sha256: snapshot.sha256, counts: snapshot.counts };
  } catch (error) {
    const message = cleanText_(error && error.message);
    properties.setProperty("CATALOG_D1_LAST_ERROR", message);
    if (force) throw error;
    Logger.log("D1 catalog mirror failed: " + message);
    return { ok: false, error: message };
  }
}

function bootstrapPublicCatalogD1() {
  const result = syncPublicCatalogSnapshotToD1_(true);
  Logger.log(JSON.stringify(result));
  return result;
}

function scheduledPublicCatalogD1Sync() {
  const result = syncPublicCatalogSnapshotToD1_();
  if (!result.ok) throw new Error(result.error);
  Logger.log(JSON.stringify(result));
  return result;
}

function enablePublicCatalogD1Sync() {
  // Verify a successful fresh upload before enabling automatic writes.
  const result = syncPublicCatalogSnapshotToD1_(true);
  const exists = ScriptApp.getProjectTriggers().some((trigger) => trigger.getHandlerFunction() === "scheduledPublicCatalogD1Sync");
  if (!exists) ScriptApp.newTrigger("scheduledPublicCatalogD1Sync").timeBased().everyMinutes(5).create();
  PropertiesService.getScriptProperties().setProperty("CATALOG_D1_SYNC_ENABLED", "true");
  Logger.log(JSON.stringify({ enabled: true, interval_minutes: 5, snapshot: result }));
  return result;
}

function auditPublicCatalogD1() {
  const snapshot = buildPublicCatalogD1Snapshot_();
  const properties = PropertiesService.getScriptProperties();
  const result = { row_count: snapshot.row_count, sha256: snapshot.sha256, counts: snapshot.counts,
    enabled: properties.getProperty("CATALOG_D1_SYNC_ENABLED") === "true",
    last_success_at: properties.getProperty("CATALOG_D1_LAST_SUCCESS_AT"),
    last_sha256: properties.getProperty("CATALOG_D1_LAST_SHA256"),
    last_error: properties.getProperty("CATALOG_D1_LAST_ERROR") };
  Logger.log(JSON.stringify(result));
  return result;
}

function disablePublicCatalogD1Sync() {
  PropertiesService.getScriptProperties().setProperty("CATALOG_D1_SYNC_ENABLED", "false");
  return "D1 mirror disabled; Google Sheets remains the source of truth";
}

function catalogCsvCell_(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
