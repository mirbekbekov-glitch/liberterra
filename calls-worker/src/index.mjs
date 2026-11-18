// Liberterra: приём звонков из «Мои Звонки» (Cloudflare Worker + D1).
// Документация API: https://www.moizvonki.ru/guide/api/
//
// Секреты (wrangler secret put): WEBHOOK_TOKEN, API_TOKEN, MZ_API_KEY.
// Переменные (wrangler.toml [vars]): MZ_DOMAIN, MZ_USER, MZ_ACCOUNT_ID.

export function normalizePhone(raw) {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 12 && d.startsWith('996')) return '+' + d;
  if (d.length === 10 && d.startsWith('0')) return '+996' + d.slice(1);
  if (d.length === 9) return '+996' + d;
  return '+' + d;
}

function safeEqual(a, b) {
  a = String(a ?? ''); b = String(b ?? '');
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

// Звонок в нашем формате из события call.finish или элемента calls.list.
export function toCall(accountId, userLogin, e) {
  const dbId = e.db_call_id ?? null;
  const pbxId = e.event_pbx_call_id ?? null;
  const key = dbId != null ? `${accountId}:${dbId}` : pbxId ? `${accountId}:p:${pbxId}` : null;
  if (!key || !userLogin) return null;
  return {
    id: key,
    user_login: String(userLogin).toLowerCase(),
    direction: Number(e.direction) === 1 ? 'out' : 'in',
    client_phone: normalizePhone(e.client_number),
    client_name: e.client_name ? String(e.client_name).slice(0, 200) : '',
    start_time: Number(e.start_time) || 0,
    answer_time: Number(e.answer_time) || 0,
    end_time: Number(e.end_time) || 0,
    duration: Number(e.duration) || 0,
    answered: Number(e.answered) === 1 ? 1 : 0,
    recording_url: /^https:\/\//i.test(e.recording || '') ? String(e.recording) : '',
    db_call_id: dbId == null ? null : Number(dbId),
  };
}

// INSERT OR IGNORE: повтор вебхука или догрузка не создают дубль.
async function saveCall(env, c) {
  const r = await env.DB.prepare(
    `INSERT OR IGNORE INTO calls (id,user_login,direction,client_phone,client_name,start_time,answer_time,end_time,duration,answered,recording_url,db_call_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(c.id, c.user_login, c.direction, c.client_phone, c.client_name, c.start_time, c.answer_time, c.end_time, c.duration, c.answered, c.recording_url, c.db_call_id).run();
  return r.meta?.changes === 1;
}

async function handleWebhook(request, env, url) {
  if (!safeEqual(url.searchParams.get('token'), env.WEBHOOK_TOKEN || '\0')) return json({ error: 'forbidden' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
  const hook = body?.webhook || {}, ev = body?.event || {};
  // Подписываемся только на call.finish; остальные события игнорируем, но отвечаем 200.
  if (hook.action !== 'call.finish') return json({ ok: true, ignored: true });
  const call = toCall(hook.account_id, hook.user_login, ev);
  if (!call) return json({ error: 'no call id or user' }, 400);
  return json({ ok: true, created: await saveCall(env, call) });
}

function authed(request, env) {
  const h = request.headers.get('authorization') || '';
  return env.API_TOKEN && safeEqual(h.replace(/^Bearer\s+/i, ''), env.API_TOKEN);
}

// Вызывается основным бэкендом после проверки сессии агента.
// Изоляция: agent (email агента) обязателен, чужие звонки не отдаём.
async function handleList(request, env, url) {
  const agent = (url.searchParams.get('agent') || '').toLowerCase();
  if (!agent) return json({ error: 'agent required' }, 400);
  const phone = normalizePhone(url.searchParams.get('client_phone'));
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200);
  const q = phone
    ? env.DB.prepare('SELECT * FROM calls WHERE user_login=? AND client_phone=? ORDER BY start_time DESC LIMIT ?').bind(agent, phone, limit)
    : env.DB.prepare('SELECT * FROM calls WHERE user_login=? ORDER BY start_time DESC LIMIT ?').bind(agent, limit);
  const { results } = await q.all();
  return json({ results: results.map(({ recording_url, ...c }) => ({ ...c, has_recording: !!recording_url })) });
}

// Запись отдаём потоком через нас: прямая ссылка провайдера клиенту не раскрывается.
async function handleRecording(request, env, url, id) {
  const agent = (url.searchParams.get('agent') || '').toLowerCase();
  const row = await env.DB.prepare('SELECT recording_url FROM calls WHERE id=? AND user_login=?').bind(id, agent).first();
  if (!row?.recording_url) return json({ error: 'not found' }, 404);
  const up = await fetch(row.recording_url);
  if (!up.ok) return json({ error: 'recording unavailable' }, 502);
  return new Response(up.body, { headers: { 'content-type': up.headers.get('content-type') || 'audio/mpeg', 'cache-control': 'private, no-store' } });
}

// Догрузка через calls.list (events мог не дойти, телефон был без интернета).
export async function backfill(env, fetchImpl = fetch) {
  const last = await env.DB.prepare('SELECT MAX(db_call_id) AS m FROM calls').first();
  let fromId = (last?.m || 0) + 1, offset = 0, saved = 0;
  for (let page = 0; page < 20; page++) {
    const res = await fetchImpl(`https://${env.MZ_DOMAIN}.moizvonki.ru/api/v1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_name: env.MZ_USER, api_key: env.MZ_API_KEY, action: 'calls.list', from_id: fromId, from_offset: offset, max_results: 100, supervised: 1 }),
    });
    if (!res.ok) throw new Error('calls.list HTTP ' + res.status);
    const data = await res.json();
    for (const e of data.results || []) {
      const c = toCall(env.MZ_ACCOUNT_ID || '', e.user_account, e);
      if (c && (await saveCall(env, c))) saved++;
    }
    if (!data.results_next_offset) break;
    offset = data.results_next_offset;
  }
  return saved;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/webhooks/moizvonki') return handleWebhook(request, env, url);
    if (url.pathname.startsWith('/api/')) {
      if (!authed(request, env)) return json({ error: 'unauthorized' }, 401);
      if (request.method === 'GET' && url.pathname === '/api/calls') return handleList(request, env, url);
      const m = url.pathname.match(/^\/api\/calls\/([^/]+)\/recording$/);
      if (request.method === 'GET' && m) return handleRecording(request, env, url, decodeURIComponent(m[1]));
    }
    return json({ error: 'not found' }, 404);
  },
  async scheduled(_event, env, ctx) { ctx.waitUntil(backfill(env)); },
};
