// Разбор выгрузки каталога и приведение к одному виду.
// Источник — CSV боевого бэкенда; забираем на сервере, чтобы не зависеть от браузера.

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some((cell) => cell !== '')) rows.push(row);
  if (!rows.length) return [];
  const head = rows[0].map((name) => name.trim());
  return rows.slice(1).map((cells) => Object.fromEntries(head.map((name, i) => [name, (cells[i] ?? '').trim()])));
}

const num = (value) => {
  const digits = String(value || '').replace(/[^\d.]/g, '');
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : null;
};

// «150000 сом», «145000 $» → сумма и валюта
function price(raw) {
  const amount = num(raw);
  if (amount === null) return { amount: null, currency: '', text: '' };
  const currency = /\$|USD/i.test(raw) ? 'USD' : /сом|KGS/i.test(raw) ? 'KGS' : '';
  return { amount, currency, text: money(amount, currency) };
}

export function money(amount, currency) {
  if (amount === null || amount === undefined) return 'Цена не указана';
  const text = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(amount);
  return currency === 'USD' ? '$' + text : currency === 'KGS' ? text + ' сом' : text;
}

// Из выгрузки берём только объявления: «Запрос» — это заявка покупателя, не объект.
const DEALS = { 'Аренда': 'rent', 'Продажа': 'sale' };

export function normalize(rows) {
  const out = [];
  for (const row of rows) {
    const deal = DEALS[row.deal];
    if (!deal) continue;
    if (row.status && row.status !== 'опубликован') continue;
    const sum = price(row.price);
    out.push({
      id: row.id,
      deal,
      segment: row.segment === 'Коммерция' ? 'commercial' : 'home',
      title: row.title || 'Объект',
      rooms: num(row.rooms),
      area: num(row.area),
      floor: row.floor || '',
      district: row.district || '',
      city: row.city || '',
      price: sum.amount,
      currency: sum.currency,
      priceText: sum.text,
      per: row.per || '',
      photos: String(row.photo_url || '').split('|').map((url) => url.trim()).filter(Boolean),
      description: row.description || '',
      agent: row.listing_agent_name || '',
      agency: row.listing_agent_agency || '',
      phone: row.listing_agent_phone || '',
      telegram: row.tg_link || '',
      lat: num(row.latitude),
      lon: num(row.longitude),
      updatedAt: row.updated_at || row.created_at || '',
      actualityAt: row.actuality_at || '',
    });
  }
  out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return out;
}
