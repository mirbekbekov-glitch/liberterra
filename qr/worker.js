// QR-редиректы liberterra.kg/<баннер> → видео, с логом сканов в Google Таблицу «QR баннеры».
// Ссылки берутся из листа «Ссылки» (кэш 60 секунд), каждый скан пишется в лист «Сканы».

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpr1tX7lhQ6R4ST1fLphJhQqWM78cSqM35ehhKNrqcWAH4SDIjZqXOYAAt2FYhYdw/exec';
const SECRET = '<ключ — в выложенном Worker; в репозитории не хранится>';
// Домен liberterra.kg пока пустой, поэтому запасной адрес — видео Чайки.
// Чтобы сменить: в листе «Ссылки» добавьте строку с именем «по умолчанию» (или default) и нужным URL.
const FALLBACK = 'https://www.instagram.com/reel/DfjNYukOWEl/';
const FALLBACK_KEYS = ['по умолчанию', 'default'];
const CACHE_SECONDS = 60;

export default {
async fetch(request, env, ctx) {
const url = new URL(request.url);
const path = url.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
const links = await getLinks(ctx);
const fallback = fallbackFrom(links);
if (!path) return Response.redirect(fallback, 302);

const target = links[path];
if (!target) return Response.redirect(fallback, 302);

ctx.waitUntil(logScan(request, path, target));
return Response.redirect(target, 302);
},
};

// Запасной адрес из таблицы, если там есть подходящая строка; иначе зашитый.
function fallbackFrom(links) {
for (const key of FALLBACK_KEYS) {
const value = links[key];
if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) return value.trim();
}
return FALLBACK;
}

async function getLinks(ctx) {
const cache = caches.default;
const cacheKey = new Request('https://qr-links.liberterra.kg/links');
const cached = await cache.match(cacheKey);
if (cached) return cached.json();

const res = await fetch(`${SCRIPT_URL}?key=${SECRET}&action=links`, { redirect: 'follow' });
const data = await res.json().catch(() => ({}));
const links = (data && data.links) || {};

ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(links), {
headers: { 'content-type': 'application/json', 'cache-control': `max-age=${CACHE_SECONDS}` },
})));
return links;
}

async function logScan(request, path, target) {
const ua = request.headers.get('user-agent') || '';
const cf = request.cf || {};
const q = new URLSearchParams({
key: SECRET,
action: 'log',
p: path,
device: detectDevice(ua),
city: cf.city || '',
country: cf.country || '',
target,
ua: ua.slice(0, 200),
});
await fetch(`${SCRIPT_URL}?${q}`, { redirect: 'follow' }).catch(() => {});
}

function detectDevice(ua) {
if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone';
if (/Android/i.test(ua)) return 'Android';
if (/bot|crawl|spider|preview|facebookexternalhit|Telegram|WhatsApp/i.test(ua)) return 'Бот/превью';
return 'Компьютер';
}
