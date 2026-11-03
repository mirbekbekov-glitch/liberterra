(()=>{'use strict';const root=document.querySelector('#agentCabinet'),content=root?.querySelector('[data-crm-content]');if(!content)return;
document.body.classList.add('crm-private-redesign');
const nav=root.querySelector('.crm-tabs');const brand=document.createElement('a');brand.href='/';brand.className='crm-private-brand';brand.textContent='Liberterra';nav.prepend(brand);
const note=document.createElement('p');note.className='crm-private-note';note.textContent='Личная рабочая область. Данные загружаются через существующий кабинет; новые CRM-разделы ещё не подключены.';content.prepend(note);
const unavailable=[['Воронка','Нет подтверждённого серверного хранения лидов.'],['Звонки','Журнал звонков не подключён.'],['Календарь','Серверное сохранение событий не подключено.'],['Договоры','Документы доступны только через существующие запросы доступа; создание и подписание не подключены.'],['Аналитика','Расчёт комиссий и конверсии не подключён.']];
for(const [label,reason]of unavailable){const b=document.createElement('button');b.type='button';b.className='crm-tab crm-unavailable';b.disabled=true;b.textContent=label+' · скоро';b.title=reason;nav.append(b)}
const panel=root.querySelector('[data-crm-panel=objects]'),grid=root.querySelector('[data-crm-objects]');
const filters=document.createElement('section');filters.className='crm-source-panel';filters.innerHTML='<fieldset><legend>Источник</legend><label><input id="crmSourceMine" type="checkbox" checked> Мои объекты</label><label><input type="checkbox" disabled aria-describedby="crmSourceReason"> Моя компания</label><label><input type="checkbox" disabled aria-describedby="crmSourceReason"> Другие организации</label></fieldset><p id="crmSourceReason">Членство компании и доступ к объектам партнёров не подтверждены сервером. Эти источники пока недоступны.</p><label for="crmSourceSearch">Поиск по объекту или агенту</label><div class="crm-source-search"><input id="crmSourceSearch" type="search" placeholder="Название объекта, район или имя моего профиля"><button id="crmSourceReset" type="button" class="crm-secondary-button">Сбросить</button></div><p id="crmSourceCount" role="status" aria-live="polite"></p>';
grid.before(filters);const search=filters.querySelector('#crmSourceSearch'),mine=filters.querySelector('#crmSourceMine'),count=filters.querySelector('#crmSourceCount');
function filter(){if(content.hidden){search.value='';count.textContent='';return}const term=search.value.trim().toLocaleLowerCase('ru'),agent=root.querySelector('[data-crm-agent-summary]')?.textContent||'';let shown=0;for(const card of grid.querySelectorAll('[data-crm-object-id]')){const status=card.querySelector('.crm-status');if(status&&!status.textContent.startsWith('Статус объекта: '))status.textContent='Статус объекта: '+status.textContent;
const badge=card.querySelector('.crm-review-badge');if(badge){const value=badge.textContent.trim();if(value==='Проверен')badge.textContent='Проверка: подтверждена';else if(value==='На модерации')badge.textContent='Проверка: не подтверждена';}
const price=card.querySelector('.crm-object-price');if(price){const cleaned=price.textContent.replace(/\s*\/(?:\s*\/)+\s*/g,' / ').replace(/\s*\/\s*$/,'').trim();if(cleaned!==price.textContent)price.textContent=cleaned;}
const matches=mine.checked&&(!term||(card.textContent+' '+agent).toLocaleLowerCase('ru').includes(term));card.hidden=!matches;if(matches)shown++}count.textContent='Найдено объектов: '+shown;}
search.addEventListener('input',filter);mine.addEventListener('change',filter);filters.querySelector('#crmSourceReset').onclick=()=>{search.value='';mine.checked=true;filter()};
new MutationObserver(filter).observe(grid,{childList:true,subtree:true,characterData:true});new MutationObserver(filter).observe(content,{attributes:true,attributeFilter:['hidden']});filter();
})();

(()=>{'use strict';
const root=document.querySelector('#agentCabinet'),content=root.querySelector('[data-crm-content]'),nav=root.querySelector('.crm-tabs');
document.body.classList.add('crm-visual-review');
root.querySelector('.crm-private-note')?.remove();
nav.querySelectorAll('.crm-unavailable').forEach(x=>x.remove());
const heading=root.querySelector('.crm-page-heading');
heading.querySelector('h1').textContent='Обзор кабинета';
heading.querySelector('.crm-eyebrow').textContent='LIBERTERRA / РАБОЧЕЕ ПРОСТРАНСТВО';
const toolbar=document.createElement('div');toolbar.className='visual-toolbar';toolbar.innerHTML='<a href="/">← На сайт</a><button type="button" id="visualTheme" aria-label="Переключить тему">◐ Тема</button>';
heading.before(toolbar);toolbar.querySelector('button').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark'};
const overview=document.createElement('section');overview.dataset.crmPanel='overview';overview.id='crmOverviewPanel';overview.className='crm-panel visual-overview';overview.setAttribute('role','tabpanel');overview.setAttribute('aria-labelledby','visualOverviewTab');
overview.innerHTML='<div class="visual-section-title"><h2>Ваш рабочий день</h2><a class="crm-primary-link" href="/add-object.html">+ Разместить объект</a></div><div id="visualStats"></div><section class="visual-distribution"><div class="visual-section-title"><h3>Состояние ваших объектов</h3><span>По данным кабинета</span></div><div class="visual-status-bar" aria-hidden="true"><i></i><i></i><i></i></div><p class="visual-legend"><span>● Активные</span><span>● На модерации</span><span>● Снятые</span></p></section><div class="visual-grid"><section class="visual-card"><div class="visual-card-title"><span class="visual-icon blue">⌂</span><h3>Объекты в работе</h3></div><p>Собственная база, актуальные цены и статусы публикаций.</p><div id="visualRecent"></div><button type="button" data-open-panel="objects" class="visual-link">Все мои объекты →</button></section><section class="visual-card"><div class="visual-card-title"><span class="visual-icon orange">▦</span><h3>Ближайшие события</h3></div><div class="visual-unavailable"><strong>Календарь ещё не подключён</strong><p>События появятся после подключения серверного хранения. Вымышленные встречи здесь не показываются.</p></div><div class="visual-mini-note">Даты и напоминания пока недоступны</div></section><section class="visual-card"><div class="visual-card-title"><span class="visual-icon green">♧</span><h3>Клиенты и заметки</h3></div><p>Существующие закрепления клиентов и ваши приватные записи.</p><div class="visual-shortcuts"><button type="button" data-open-panel="clients">Клиенты →</button><button type="button" data-open-panel="notes">Мои заметки →</button></div></section><section class="visual-card"><div class="visual-card-title"><span class="visual-icon burgundy">◇</span><h3>Воронка и комиссии</h3></div><div class="visual-unavailable"><strong>Данные пока не подключены</strong><p>Сделки, суммы комиссий и конверсия не рассчитываются без серверных данных.</p></div></section></div>';
content.append(overview);overview.querySelector('#visualStats').append(root.querySelector('[data-crm-counters]'));
const lowerCards=overview.querySelectorAll('.visual-grid>.visual-card');lowerCards[2].remove();lowerCards[3].remove();
const definitions=[['overview','📊','Обзор'],['pipeline','🔄','Воронка'],['clients','👥','Клиенты'],['calls','📞','Звонки'],['objects','🏠','Объекты'],['analytics','📈','Аналитика'],['calendar','📅','Календарь'],['contracts','📄','Договоры'],['requests','📝','Заявки'],['messages','💬','Сообщения'],['notes','✎','Заметки'],['private-access','◇','Доступ к данным']];
for(const[id,icon,label]of definitions){let b=nav.querySelector('[data-crm-tab="'+id+'"]');if(!b){b=document.createElement('button');b.type='button';b.className='crm-tab';if(id==='overview'){b.dataset.crmTab=id;b.id='visualOverviewTab';b.setAttribute('role','tab');b.setAttribute('aria-controls','crmOverviewPanel')}else{b.disabled=true;b.title='Серверная функция ещё не подключена';b.classList.add('visual-soon')}}b.innerHTML='<span class="visual-nav-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>'+ (b.disabled?'<small>скоро</small>':'');nav.append(b);if(id==='overview'){const profile=document.createElement('a');profile.className='visual-profile-link';profile.href='/profile';profile.innerHTML='<span class="visual-nav-icon" aria-hidden="true">👤</span><span>Мой профиль</span><span class="visual-profile-arrow" aria-hidden="true">↗</span>';nav.append(profile)}}
const bottom=document.createElement('div');bottom.className='visual-sidebar-bottom';bottom.innerHTML='<strong>Личный кабинет</strong><span>Закрытая рабочая область</span>';nav.append(bottom);
const menu=document.createElement('button');menu.type='button';menu.className='visual-menu';menu.textContent='☰ Разделы';menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-controls','visualNavigation');nav.id='visualNavigation';toolbar.prepend(menu);menu.onclick=()=>{const open=nav.classList.toggle('visual-open');menu.setAttribute('aria-expanded',String(open))};
root.addEventListener('click',e=>{const shortcut=e.target.closest('[data-open-panel]');if(shortcut)nav.querySelector('[data-crm-tab="'+shortcut.dataset.openPanel+'"]').click();const tab=e.target.closest('[data-crm-tab]');if(tab){heading.querySelector('h1').textContent=definitions.find(x=>x[0]===tab.dataset.crmTab)?.[2]||'Кабинет';nav.classList.remove('visual-open');menu.setAttribute('aria-expanded','false')}});
let initialized=false;
function update(){if(content.hidden){initialized=false;return}const counters=[...root.querySelectorAll('.crm-counter:not(.visual-total)')];const total=counters.reduce((s,x)=>s+Number(x.querySelector('strong')?.textContent||0),0);let totalCard=root.querySelector('.visual-total');if(!totalCard){totalCard=document.createElement('div');totalCard.className='crm-counter visual-total';totalCard.innerHTML='<strong></strong><span>Всего объектов</span>';root.querySelector('[data-crm-counters]').append(totalCard)}totalCard.querySelector('strong').textContent=total;overview.querySelectorAll('.visual-status-bar i').forEach((x,i)=>{x.style.flex=total?Number(counters[i]?.querySelector('strong')?.textContent||0):1});overview.querySelector('.visual-status-bar').hidden=!total;
const recent=overview.querySelector('#visualRecent');recent.replaceChildren();const cards=[...root.querySelectorAll('[data-crm-object-id]')];for(const card of cards.slice(0,3)){const row=document.createElement('div');row.className='visual-recent-row';const title=document.createElement('strong');title.textContent=card.querySelector('h3')?.textContent||'Объект';const price=document.createElement('span');price.textContent=card.querySelector('.crm-object-price')?.textContent||'';row.append(title,price);recent.append(row)}if(!cards.length){recent.textContent='В кабинете пока нет объектов.'}
if(!initialized){initialized=true;nav.querySelector('[data-crm-tab=overview]').click()}}
new MutationObserver(update).observe(content,{attributes:true,attributeFilter:['hidden']});new MutationObserver(update).observe(root.querySelector('[data-crm-objects]'),{childList:true,subtree:true,characterData:true});update();
})();

/* Cabinet-only photo delivery repair. Append to the current /crm-private-ui.js asset. */
(() => {
  'use strict';
  const grid = document.querySelector('#agentCabinet [data-crm-objects]');
  if (!grid) return;
  const oldHost = 'hidden-pine-cbff.mirbekbekov.workers.dev';
  const fallback = '/assets/liberterra-mark-adapted.png';

  function repair(image) {
    if (!(image instanceof HTMLImageElement) || !image.matches('.crm-object-photo')) return;
    if (image.dataset.crmPhotoRepair) return;
    image.dataset.crmPhotoRepair = '1';
    image.addEventListener('error', () => {
      if (image.dataset.crmPhotoFallback) return;
      image.dataset.crmPhotoFallback = '1';
      image.style.objectFit = 'contain';
      image.style.boxSizing = 'border-box';
      image.style.padding = '24px';
      image.src = fallback;
    });
    try {
      const source = new URL(image.src, location.href);
      const filename = decodeURIComponent(source.pathname.split('/').pop() || '');
      if (source.hostname === oldHost && /^object_[^/]+\.(?:jpe?g|png|webp)$/i.test(filename)) {
        image.src = '/uploads/' + encodeURIComponent(filename);
      }
    } catch (_) { /* The error handler still protects a malformed source. */ }
  }

  grid.querySelectorAll('img.crm-object-photo').forEach(repair);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches('img.crm-object-photo')) repair(node);
      node.querySelectorAll('img.crm-object-photo').forEach(repair);
    }
  }).observe(grid, { childList: true, subtree: true });
})();
