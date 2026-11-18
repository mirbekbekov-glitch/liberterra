var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.mjs
import { DurableObject } from "cloudflare:workers";

// ../request-abuse-gate-core.mjs
var guestRequestLimits = Object.freeze([
  { kind: "content", windowMs: 10 * 6e4, max: 1 },
  { kind: "phone", windowMs: 60 * 6e4, max: 3 },
  { kind: "ip", windowMs: 6e4, max: 20 }
]);
var digestPattern = /^[a-f0-9]{64}$/;
function initializeGuestRequestGate(sql) {
  sql.exec(`CREATE TABLE IF NOT EXISTS guest_request_events (
    kind TEXT NOT NULL,
    digest TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
  sql.exec("CREATE INDEX IF NOT EXISTS guest_request_events_lookup ON guest_request_events(kind, digest, created_at)");
}
__name(initializeGuestRequestGate, "initializeGuestRequestGate");
function reserveGuestRequest(storage, { now, keys }) {
  if (!Number.isSafeInteger(now) || now < 0 || !keys || typeof keys !== "object") {
    throw new TypeError("invalid_gate_input");
  }
  for (const rule of guestRequestLimits) {
    if (typeof keys[rule.kind] !== "string" || !digestPattern.test(keys[rule.kind])) {
      throw new TypeError("invalid_gate_key");
    }
  }
  return storage.transactionSync(() => {
    const sql = storage.sql;
    sql.exec("DELETE FROM guest_request_events WHERE created_at <= ?", now - 60 * 6e4);
    for (const rule of guestRequestLimits) {
      const row = sql.exec(
        "SELECT COUNT(*) AS count FROM guest_request_events WHERE kind = ? AND digest = ? AND created_at > ?",
        rule.kind,
        keys[rule.kind],
        now - rule.windowMs
      ).one();
      if (Number(row.count) >= rule.max) return { allowed: false, reason: rule.kind };
    }
    for (const rule of guestRequestLimits) {
      sql.exec(
        "INSERT INTO guest_request_events(kind, digest, created_at) VALUES (?, ?, ?)",
        rule.kind,
        keys[rule.kind],
        now
      );
    }
    return { allowed: true };
  });
}
__name(reserveGuestRequest, "reserveGuestRequest");

// worker.mjs
var __name2 = /* @__PURE__ */ __name((fn) => fn, "__name");
function corsResponse(_request, body, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
__name(corsResponse, "corsResponse");
async function stagingSyntheticAppend(options, env) {
  const data = JSON.parse(options.body);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.row_json))), (b) => b.toString(16).padStart(2, "0")).join("");
  const expected = await serverActionSignature("append\n" + data.timestamp + "\n" + data.nonce + "\n" + digest, env.SHEETS_WRITE_SECRET);
  return Response.json({ ok: data.action === "append" && data.signature === expected });
}
__name(stagingSyntheticAppend, "stagingSyntheticAppend");
var GuestRequestLimiter = class extends DurableObject {
  static {
    __name(this, "GuestRequestLimiter");
  }
  constructor(ctx, env) {
    super(ctx, env);
    initializeGuestRequestGate(ctx.storage.sql);
  }
  reserve(keys) {
    return reserveGuestRequest(this.ctx.storage, { now: Date.now(), keys });
  }
};
async function hashGuestRequestKey(value, key) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.sign("HMAC", key, bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(hashGuestRequestKey, "hashGuestRequestKey");
async function reserveGuestRequestInWorker(request, env, details) {
  const limiter = env.GUEST_REQUEST_LIMITER;
  const ip = request.headers.get("cf-connecting-ip");
  const hashSecret = String(env.GUEST_REQUEST_HASH_KEY || "");
  if (!limiter || !ip || hashSecret.length < 32) return { allowed: false, unavailable: true };
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(hashSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const keys = {
      content: await hashGuestRequestKey(JSON.stringify(details), key),
      phone: await hashGuestRequestKey(details.phoneDigits, key),
      ip: await hashGuestRequestKey(ip, key)
    };
    const stub = limiter.get(limiter.idFromName("liberterra-guest-requests-v1"));
    return await stub.reserve(keys);
  } catch (_) {
    return { allowed: false, unavailable: true };
  }
}
__name(reserveGuestRequestInWorker, "reserveGuestRequestInWorker");
async function signedAppendPayload(row, secret) {
  if (!secret) throw new Error("append_signing_not_configured");
  const row_json = JSON.stringify(row);
  const timestamp = Math.floor(Date.now() / 1e3);
  const nonce = crypto.randomUUID();
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(row_json)));
  const hash = [...digest].map((value) => value.toString(16).padStart(2, "0")).join("");
  const signature = await serverActionSignature("append\n" + timestamp + "\n" + nonce + "\n" + hash, secret);
  return { action: "append", row_json, timestamp, nonce, signature };
}
__name(signedAppendPayload, "signedAppendPayload");
async function serverActionSignature(canonical, botToken) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(String(botToken || "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(canonical)));
  return [...signature].map((value) => value.toString(16).padStart(2, "0")).join("");
}
__name(serverActionSignature, "serverActionSignature");
async function createSearchRequest(request, env) {
  const respond = /* @__PURE__ */ __name2((body, status = 200) => corsResponse(request, body, status), "respond");
  if (!(request.headers.get("content-type") || "").includes("multipart/form-data")) {
    return respond({ ok: false, error: "invalid_content_type" }, 415);
  }
  let form;
  try {
    form = await request.formData();
  } catch (_) {
    return respond({ ok: false, error: "invalid_form_data" }, 400);
  }
  if (String(form.get("website") || "").trim()) return respond({ ok: true, id: crypto.randomUUID() });
  if (String(form.get("telegram_init_data") || "").trim()) return respond({ ok: false, error: "synthetic_only" }, 403);
  const telegramAuthor = null;
  for (const field of ["deal", "housing_type", "district", "budget", "budget_currency", "name", "phone"]) {
    if (!String(form.get(field) || "").trim()) return respond({ ok: false, error: `required_${field}` }, 400);
  }
  if (form.get("public_consent") !== "yes") return respond({ ok: false, error: "public_consent_required" }, 400);
  if (String(form.get("name")) !== "Synthetic Test" || String(form.get("phone")) !== "+999 000 000000") return respond({ ok: false, error: "synthetic_only" }, 403);
  const id = crypto.randomUUID();
  const value = /* @__PURE__ */ __name2((name, limit = 300) => String(form.get(name) || "").trim().slice(0, limit), "value");
  const phone = value("phone", 40);
  const phoneDigits = phone.replace(/\D/g, "");
  if (!/^[+0-9 ()-]{7,25}$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return respond({ ok: false, error: "invalid_phone" }, 400);
  }
  if (!env.SHEETS_WRITE_SECRET) return respond({ ok: false, error: "append_signing_not_configured" }, 503);
  const admission = await reserveGuestRequestInWorker(request, env, {
    deal: value("deal", 20),
    housingType: value("housing_type", 80),
    district: value("district", 160),
    rooms: value("rooms", 20),
    budget: value("budget", 50),
    currency: value("budget_currency", 10),
    wishes: value("wishes", 1200),
    phoneDigits
  });
  if (admission.unavailable) return respond({ ok: false, error: "request_guard_unavailable" }, 503);
  if (!admission.allowed) return respond({ ok: false, error: "request_rate_limited" }, 429);
  const text = [
    "\u{1F50E} \u041D\u043E\u0432\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0441 \u0441\u0430\u0439\u0442\u0430",
    `ID: ${id.slice(0, 8).toUpperCase()}`,
    `\u{1F3F7} ${value("deal", 20)} \u2014 ${value("housing_type", 80)}`,
    `\u{1F4CD} ${value("district", 160)}`,
    `\u{1F6AA} \u041A\u043E\u043C\u043D\u0430\u0442: ${value("rooms", 20) || "\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E"}`,
    `\u{1F4B0} \u0411\u044E\u0434\u0436\u0435\u0442: ${value("budget", 50)} ${value("budget_currency", 10)}`,
    `\u{1F4DD} ${value("wishes", 1200) || "\u0411\u0435\u0437 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u043F\u043E\u0436\u0435\u043B\u0430\u043D\u0438\u0439"}`,
    `\u{1F464} ${value("name", 120)}`,
    `\u260E\uFE0F ${value("phone", 40)}`
  ].join("\n");
  const deal = value("deal", 20);
  const housingType = value("housing_type", 80);
  const rooms = value("rooms", 20);
  const budget = value("budget", 50);
  const currency = value("budget_currency", 10);
  const normalizedPhone = phoneDigits.startsWith("0") ? `996${phoneDigits.slice(1)}` : phoneDigits;
  const verb = deal === "\u041F\u043E\u043A\u0443\u043F\u043A\u0430" ? "\u041A\u0443\u043F\u043B\u044E" : "\u0421\u043D\u0438\u043C\u0443";
  const title = `${verb} ${rooms ? `${rooms}-\u043A\u043E\u043C\u043D. ` : ""}${housingType.toLowerCase()}`;
  const contactText = `\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u041F\u0438\u0448\u0443 \u043F\u043E \u0437\u0430\u044F\u0432\u043A\u0435 \u0441 \u0441\u0430\u0439\u0442\u0430 Liberterra:
${title}
\u0420\u0430\u0439\u043E\u043D: ${value("district", 160)}
\u0411\u044E\u0434\u0436\u0435\u0442: ${budget} ${currency}`;
  const submittedAt = (/* @__PURE__ */ new Date()).toISOString();
  const row = {
    segment: housingType === "\u041A\u043E\u043C\u043C\u0435\u0440\u0447\u0435\u0441\u043A\u0430\u044F \u043D\u0435\u0434\u0432\u0438\u0436\u0438\u043C\u043E\u0441\u0442\u044C" ? "\u041A\u043E\u043C\u043C\u0435\u0440\u0446\u0438\u044F" : "\u0416\u0438\u043B\u044C\u0451",
    city: "\u0411\u0438\u0448\u043A\u0435\u043A",
    deal: "\u0417\u0430\u043F\u0440\u043E\u0441",
    rooms,
    price: `${budget} ${currency}`,
    per: deal === "\u041F\u043E\u043A\u0443\u043F\u043A\u0430" ? "" : "/ \u043C\u0435\u0441",
    title,
    district: value("district", 160),
    verified: "FALSE",
    photo_url: "",
    tg_link: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(contactText)}`,
    status: "\u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D",
    id: `web-${id}`,
    phone,
    contact_name: value("name", 120),
    // The form requires public_consent=yes above. Store the applicant's
    // consent-backed public contact separately from the private phone field.
    public_contact_phone: phone,
    description: `\u0422\u0438\u043F \u0437\u0430\u044F\u0432\u043A\u0438: ${deal}
\u041F\u043E\u0436\u0435\u043B\u0430\u043D\u0438\u044F: ${value("wishes", 1200) || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E"}
\u0418\u043C\u044F: ${value("name", 120)}`,
    listing_agent_id: telegramAuthor ? String(telegramAuthor.id) : "",
    poster_type: "\u043A\u043B\u0438\u0435\u043D\u0442",
    created_at: submittedAt,
    updated_at: submittedAt
  };
  let sheetResponse;
  try {
    sheetResponse = await stagingSyntheticAppend({
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(await signedAppendPayload(row, env.SHEETS_WRITE_SECRET)),
      redirect: "follow"
    }, env);
  } catch (_) {
    return respond({
      ok: false,
      error: "append_result_unknown",
      message: "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0437\u0430\u043F\u0438\u0441\u0438 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0437\u0430\u044F\u0432\u043A\u0443 \u043F\u0435\u0440\u0435\u0434 \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E\u0439 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u043E\u0439."
    }, 502);
  }
  const sheetResult = await sheetResponse.json().catch(() => ({ error: "append_result_unknown" }));
  if (!sheetResponse.ok || sheetResult.ok !== true) {
    const uncertain = ["append_result_unknown", "append_in_progress", "server_error"].includes(sheetResult.error);
    return respond({
      ok: false,
      error: uncertain ? "append_result_unknown" : "catalog_sync_failed",
      message: uncertain ? "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0437\u0430\u043F\u0438\u0441\u0438 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0437\u0430\u044F\u0432\u043A\u0443 \u043F\u0435\u0440\u0435\u0434 \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E\u0439 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u043E\u0439." : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0437\u0430\u044F\u0432\u043A\u0438."
    }, 502);
  }
  const adminNotified = false;
  return respond({
    ok: true,
    id,
    status: "\u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D",
    admin_notified: adminNotified,
    groups_published: 0,
    groups_expected: 0
  });
}
__name(createSearchRequest, "createSearchRequest");
var worker_default = { async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/requests" || request.method !== "POST") return Response.json({ ok: false, error: "staging_route_disabled" }, { status: 404 });
  return createSearchRequest(request, env);
} };
export {
  GuestRequestLimiter,
  worker_default as default
};
//# sourceMappingURL=worker.js.map
