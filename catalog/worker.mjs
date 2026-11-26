// Новый каталог Liberterra. Отдельный Worker; данные берёт с боевого бэкенда по HTTP.
import { parseCSV, normalize } from './data.mjs';
import { listPage, objectPage, agentsPage, notFound } from './views.mjs';

// Источник данных — старый бэкенд. Обращаемся к нему привязкой BACKEND:
// Worker не может вызвать другой Worker по внешнему адресу, Cloudflare это блокирует.
const UPSTREAM_PATH = '/api/public-catalog';
const AGENTS_PATH = '/api/public-agents';
const UPSTREAM_ORIGIN = 'https://liberterra.kg';
const TTL_MS = 120000;
let cache = { at: 0, items: [] };

// Привязка, если она есть; иначе обычный запрос — так удобно гонять код локально.
function backendFetch(env, url, init = {}) {
  const request = new Request(url, { ...init, signal: AbortSignal.timeout(8000) });
  return env.BACKEND ? env.BACKEND.fetch(request) : fetch(request, { cf: { cacheTtl: 60 } });
}

async function load(env, ctx) {
  const now = Date.now();
  if (cache.items.length && now - cache.at < TTL_MS) return cache.items;
  const stale = cache.items;
  const url = env.CATALOG_SOURCE || UPSTREAM_ORIGIN + UPSTREAM_PATH;
  const response = await backendFetch(env, url, { headers: { accept: 'text/csv' } });
  if (!response.ok) {
    if (stale.length) return stale;            // источник прилёг — лучше показать прежние данные
    throw new Error('upstream_' + response.status);
  }
  const items = normalize(parseCSV(await response.text()));
  cache = { at: now, items };
  return items;
}

function filter(items, query) {
  const q = (query.get('q') || '').trim().toLocaleLowerCase('ru');
  const deal = query.get('deal') || '';
  const segment = query.get('segment') || '';
  const rooms = Number(query.get('rooms')) || 0;
  const priceMax = Number(query.get('priceMax')) || 0;
  return items.filter((item) => {
    if (deal && item.deal !== deal) return false;
    if (segment && item.segment !== segment) return false;
    if (rooms && !(item.rooms >= rooms)) return false;
    if (priceMax && !(item.price !== null && item.price <= priceMax)) return false;
    if (q && !`${item.title} ${item.district} ${item.city} ${item.description}`.toLocaleLowerCase('ru').includes(q)) return false;
    return true;
  });
}

const html = (body, status = 200) => new Response(body, {
  status,
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60', 'x-content-type-options': 'nosniff' },
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('method_not_allowed', { status: 405, headers: { allow: 'GET' } });

    if (url.pathname === '/healthz') return new Response('ok', { headers: { 'content-type': 'text/plain' } });

    let items;
    try {
      items = await load(env, ctx);
    } catch (error) {
      if (cache.items.length) items = cache.items;
      else return html(`<!doctype html><meta charset="utf-8"><title>Каталог временно недоступен</title>
        <body style="font:16px system-ui;padding:40px;max-width:640px;margin:auto">
        <h1 style="font-size:22px">Каталог временно недоступен</h1>
        <p>Не удалось получить данные объявлений. Обновите страницу через минуту.</p></body>`, 503);
    }

    if (url.pathname === '/api/listings') {
      return new Response(JSON.stringify({ ok: true, total: items.length, items: filter(items, url.searchParams) }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' },
      });
    }

    if (url.pathname === '/' || url.pathname === '') {
      const found = filter(items, url.searchParams);
      const query = Object.fromEntries(url.searchParams.entries());
      return html(listPage({ items: found, total: items.length, query, canonical: url.origin + '/' }));
    }

    if (url.pathname === '/agents') {
      let agents = [];
      try {
        const source = env.AGENTS_SOURCE || UPSTREAM_ORIGIN + AGENTS_PATH;
        const response = await backendFetch(env, source);
        if (response.ok) agents = (await response.json()).agents || [];
      } catch (_) { agents = []; }
      return html(agentsPage({ agents, canonical: url.origin + '/agents' }));
    }

    const match = /^\/o\/([^/]+)$/.exec(url.pathname);
    if (match) {
      const id = decodeURIComponent(match[1]);
      const item = items.find((entry) => entry.id === id);
      if (!item) return html(notFound(), 404);
      return html(objectPage({ item, canonical: url.origin + '/o/' + encodeURIComponent(id) }));
    }

    return html(notFound(), 404);
  },
};
