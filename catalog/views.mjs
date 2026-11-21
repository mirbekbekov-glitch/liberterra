import { esc, shell } from './page.mjs';

const DEAL_LABEL = { rent: 'Аренда', sale: 'Продажа' };
const plural = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? many : b > 1 && b < 5 ? few : b === 1 ? one : many; };

const place = (item) => [...new Set([item.district, item.city].filter(Boolean))].join(', ');

function card(item) {
  const photo = item.photos[0];
  const rooms = item.rooms ? `${item.rooms} ${plural(item.rooms, 'комната', 'комнаты', 'комнат')}` : '';
  const area = item.area ? `${item.area} м²` : '';
  const line = [rooms, area, item.floor].filter(Boolean).join(' · ');
  return `<a class="card" href="/o/${encodeURIComponent(item.id)}">
    <div class="shot">${photo
      ? `<img src="${esc(photo)}" alt="${esc(item.title)}" loading="lazy" referrerpolicy="no-referrer">`
      : '<span class="empty">Фотографий пока нет</span>'}
      <span class="badge">${esc(DEAL_LABEL[item.deal])}</span>
    </div>
    <div class="card-body">
      <div class="price">${esc(item.priceText)}${item.per ? ` <span class="per">/ ${esc(item.per)}</span>` : ''}</div>
      <h3>${esc(item.title)}</h3>
      ${line ? `<p class="meta">${esc(line)}</p>` : ''}
      <p class="where">${esc(place(item) || 'Адрес не указан')}</p>
    </div>
  </a>`;
}

export function listPage({ items, total, query, canonical }) {
  const { deal = '', q = '', rooms = '', priceMax = '', segment = '' } = query;
  const tab = (value, label) => `<button class="tab" type="submit" name="deal" value="${value}" aria-pressed="${deal === value}">${label}</button>`;
  const body = `
  <h1>Недвижимость в Бишкеке</h1>
  <p class="lead">Объявления от собственников и проверенных агентов.</p>
  <form class="panel" method="get" action="/">
    <div class="tabs">${tab('', 'Все')}${tab('sale', 'Купить')}${tab('rent', 'Снять')}</div>
    <div class="filters">
      <label class="field"><span>Поиск</span><input type="search" name="q" value="${esc(q)}" placeholder="Район, название, описание"></label>
      <label class="field"><span>Тип</span><select name="segment">
        <option value="">Любой</option>
        <option value="home"${segment === 'home' ? ' selected' : ''}>Жильё</option>
        <option value="commercial"${segment === 'commercial' ? ' selected' : ''}>Коммерция</option>
      </select></label>
      <label class="field"><span>Комнат, от</span><select name="rooms">
        <option value="">Любое</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}"${String(rooms) === String(n) ? ' selected' : ''}>${n}+</option>`).join('')}
      </select></label>
      <label class="field"><span>Цена до</span><input type="number" name="priceMax" min="0" step="1000" value="${esc(priceMax)}" placeholder="без ограничений"></label>
      <button class="btn" type="submit">Показать</button>
    </div>
  </form>
  <div class="count"><b>${items.length} ${plural(items.length, 'объект', 'объекта', 'объектов')}</b>
    <span>${total !== items.length ? `из ${total} в базе` : 'всего в базе'}</span></div>
  ${items.length ? `<div class="grid">${items.map(card).join('')}</div>` : `<div class="panel empty-state">
      <b>Под эти условия ничего нет</b>
      ${total ? 'Снимите часть фильтров — в базе есть другие объекты.' : 'В каталоге пока нет опубликованных объявлений.'}
    </div>`}`;
  return shell({ title: 'Недвижимость в Бишкеке — Liberterra', description: 'Аренда и продажа недвижимости в Бишкеке: квартиры, дома, коммерция.', body, canonical });
}

export function objectPage({ item, canonical }) {
  const rooms = item.rooms ? `${item.rooms} ${plural(item.rooms, 'комната', 'комнаты', 'комнат')}` : '—';
  const facts = [['Сделка', DEAL_LABEL[item.deal]], ['Комнат', rooms], ['Площадь', item.area ? `${item.area} м²` : '—'],
    ['Этаж', item.floor || '—']];
  if (item.district && item.district !== item.city) facts.push(['Район', item.district]);
  facts.push(['Город', item.city || '—']);
  const photos = item.photos;
  const contact = [
    item.phone ? `<a class="btn" href="tel:+${esc(String(item.phone).replace(/\D/g, ''))}">Позвонить</a>` : '',
    item.telegram ? `<a class="btn ghost" href="${esc(item.telegram)}" target="_blank" rel="noopener">Написать в Telegram</a>` : '',
  ].filter(Boolean).join('');
  const body = `
  <p class="lead" style="margin:18px 0 0"><a href="/">← Все объекты</a></p>
  <h1>${esc(item.title)}${place(item) ? `, ${esc(place(item))}` : ''}</h1>
  <div class="obj">
    <div>
      <div class="gallery">
        <div class="main">${photos.length
          ? `<img id="shot" src="${esc(photos[0])}" alt="${esc(item.title)}" referrerpolicy="no-referrer">`
          : '<span class="note">Фотографий пока нет</span>'}</div>
        ${photos.length > 1 ? `<div class="thumbs">${photos.map((url, i) =>
          `<button type="button" data-src="${esc(url)}" aria-current="${i === 0}"><img src="${esc(url)}" alt="Фото ${i + 1}" loading="lazy" referrerpolicy="no-referrer"></button>`).join('')}</div>` : ''}
      </div>
      ${item.description ? `<div class="panel" style="margin-top:18px"><h2 style="margin:0 0 8px;font:600 18px 'Onest',sans-serif">Описание</h2><div class="desc">${esc(item.description)}</div></div>` : ''}
    </div>
    <aside class="side">
      <div class="panel">
        <div class="price">${esc(item.priceText)}${item.per ? ` <span class="per">/ ${esc(item.per)}</span>` : ''}</div>
        <dl class="facts" style="margin-top:14px">${facts.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </div>
      <div class="panel">
        <h2 style="margin:0 0 10px;font:600 17px 'Onest',sans-serif">${item.agent ? esc(item.agent) : 'Контакты'}</h2>
        ${item.agency ? `<p class="note" style="margin:0 0 10px">${esc(item.agency)}</p>` : ''}
        ${contact || '<p class="note" style="margin:0">Контакты не указаны. Напишите нам — найдём, кто ведёт объект.</p>'}
      </div>
      ${item.actualityAt ? `<p class="note">Актуальность подтверждена ${esc(new Date(item.actualityAt).toLocaleDateString('ru-RU'))}</p>` : ''}
    </aside>
  </div>
  <script>
  document.querySelectorAll('.thumbs button').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('shot').src = b.dataset.src;
    document.querySelectorAll('.thumbs button').forEach((x) => x.setAttribute('aria-current', String(x === b)));
  }));
  </script>`;
  return shell({ title: `${item.title}${item.district ? ', ' + item.district : ''} — ${item.priceText} — Liberterra`,
    description: (item.description || `${item.title} в Бишкеке`).slice(0, 160), body, canonical });
}

export function notFound() {
  return shell({ title: 'Объект не найден — Liberterra', description: 'Страница не найдена',
    body: `<div class="panel empty-state" style="margin-top:40px"><b>Объект не найден</b>Возможно, объявление сняли с публикации. <a href="/">Вернуться в каталог</a></div>` });
}


export function agentsPage({ agents, canonical }) {
  const card = (agent) => `<article class="panel" style="display:flex;gap:14px;align-items:flex-start">
    ${agent.avatar_url ? `<img src="${esc(agent.avatar_url)}" alt="" width="56" height="56" loading="lazy" referrerpolicy="no-referrer" style="border-radius:50%;object-fit:cover;flex:0 0 56px">`
      : `<span style="flex:0 0 56px;width:56px;height:56px;border-radius:50%;background:var(--red-soft);color:var(--red);display:grid;place-items:center;font:600 18px 'Onest',sans-serif">${esc((agent.name || '?').trim()[0] || '?')}</span>`}
    <div style="min-width:0">
      <h2 style="margin:0 0 2px;font:600 17px 'Onest',sans-serif">${esc(agent.name || 'Агент')}</h2>
      <p class="note" style="margin:0 0 8px">${esc([agent.agency, agent.specialization === 'rent' ? 'аренда' : agent.specialization === 'sale' ? 'продажа' : '', agent.experience ? `опыт ${agent.experience} лет` : ''].filter(Boolean).join(' · '))}</p>
      ${agent.username ? `<a class="btn ghost" href="https://t.me/${esc(agent.username)}" target="_blank" rel="noopener">Написать в Telegram</a>` : ''}
    </div></article>`;
  const body = `<h1>Агенты</h1>
  <p class="lead">Специалисты, которые ведут объекты в каталоге.</p>
  ${agents.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${agents.map(card).join('')}</div>`
    : `<div class="panel empty-state"><b>Агентов пока нет</b>Как только появятся — они будут здесь.</div>`}`;
  return shell({ title: 'Агенты — Liberterra', description: 'Агенты Liberterra в Бишкеке', body, canonical });
}
