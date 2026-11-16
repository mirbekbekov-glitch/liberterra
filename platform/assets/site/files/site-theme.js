if (location.pathname === "/api/crm/agent-cabinet") location.replace("/agent-cabinet.html");
/* Additive shell: keep existing language, profile and notification handlers. */
(() => {
  function boot() {
    const header = document.querySelector('body > header, body > .submission-page-nav');
    if (!header || header.dataset.sharedTheme) return;
    header.dataset.sharedTheme = 'true';
    header.classList.add('lt-header');
    const row = header.querySelector('.header-inner, .crm-header-inner') || header;
    row.classList.add('lt-header-row');
    let brand = row.querySelector('.brand');
    if (!brand) {
      const home = row.querySelector('a[href="/"]');
      brand = home || document.createElement('a');
      brand.classList.add('brand');
      brand.href = '/';
      if (!home) row.prepend(brand);
    }
    if (!brand.querySelector('img')) {
      const logo = document.createElement('img');
      logo.className = 'brand-logo';
      logo.src = '/assets/liberterra-logo-adapted.png';
      logo.alt = 'Liberterra';
      brand.replaceChildren(logo);
    }
    const navigation = [
      ['/index.html?deal=продажа', 'Купить', 'buy'],
      ['/index.html?deal=аренда', 'Снять', 'rent'],
      ['/newbuildings.html', 'Новостройки', 'newbuildings'],
      ['/mortgage.html', 'Ипотека', 'mortgage'],
      ['/requests.html', 'Заявки', 'requests'],
      ['/agents.html', 'Агенты', 'agents'],
    ];
    let nav = row.querySelector('.lt-navigation, .home-navigation');
    if (!nav) {
      nav = document.createElement('nav');
      brand.after(nav);
    }
    nav.className = 'lt-navigation';
    nav.setAttribute('aria-label', 'Разделы Liberterra');
    const deal = new URLSearchParams(location.search).get('deal');
    const isCurrent = (key, path) => {
      if (key === 'buy' || key === 'rent') return location.pathname === '/' || location.pathname === '/index.html'
        ? deal === (key === 'buy' ? 'продажа' : 'аренда')
        : false;
      return location.pathname === path;
    };
    nav.replaceChildren(...navigation.map(([path, text, key]) => {
      const link = document.createElement('a');
      link.href = path;
      link.textContent = text;
      if (isCurrent(key, path)) link.setAttribute('aria-current', 'page');
      return link;
    }));
    const knownUser = () => {
      try {
        const raw = localStorage.getItem('liberterra-verified-web-user');
        const record = raw && JSON.parse(raw);
        return record?.verified_at && Date.now() - Number(record.verified_at) < 7 * 24 * 60 * 60 * 1000 ? record.user : null;
      } catch (_) { return null; }
    };
    const renderAccountMenu = () => {
      const current = knownUser();
      const existing = row.querySelector('.lt-account-menu');
      const profile = row.querySelector('.header-profile');
      if (!current) {
        existing?.remove();
        if (profile) { profile.hidden = false; profile.textContent = 'Профиль'; }
        return;
      }
      if (existing) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'lt-account-menu';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'lt-account-trigger';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = `<span class="lt-account-avatar" aria-hidden="true">${String(current.name || 'П').trim().slice(0, 1).toUpperCase()}</span><span>Профиль</span><span class="lt-account-chevron" aria-hidden="true">⌄</span>`;
      const panel = document.createElement('section');
      panel.className = 'lt-account-panel';
      panel.hidden = true;
      panel.innerHTML = `<p>Профиль</p><strong>${String(current.account_type || 'Пользователь').toUpperCase()}</strong><a href="/profile.html">Мой профиль</a><a href="/my-listings.html">Мои объявления</a><a href="/messages.html">Сообщения</a><a href="/profile.html#profileFavorites">Избранное</a><hr><button type="button" data-account-logout>Выйти</button>`;
      trigger.addEventListener('click', () => {
        const open = panel.hidden;
        panel.hidden = !open;
        trigger.setAttribute('aria-expanded', String(open));
      });
      panel.addEventListener('click', async (event) => {
        if (!event.target.closest('[data-account-logout]')) return;
        const button = event.target.closest('[data-account-logout]');
        button.disabled = true;
        button.textContent = 'Выходим…';
        try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); } finally {
          localStorage.removeItem('liberterra-verified-web-user');
          sessionStorage.removeItem('liberterra-verified-web-user');
          sessionStorage.removeItem('liberterra-profile-view');
          location.assign('/');
        }
      });
      document.addEventListener('click', (event) => { if (!wrapper.contains(event.target)) { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); } });
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); } });
      profile?.setAttribute('hidden', '');
      wrapper.append(trigger, panel);
      (profile || row.lastElementChild)?.before(wrapper);
    };
    renderAccountMenu();
    window.addEventListener('liberterra:user-registered', () => {
      row.querySelector('.lt-account-menu')?.remove();
      renderAccountMenu();
    });
    if (!document.querySelector('link[data-liberterra-messages-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = '/messages.css?v=20261001-1';
      style.dataset.liberterraMessagesStyle = 'true';
      document.head.append(style);
    }
    if (!document.querySelector('script[data-liberterra-messages-script]')) {
      const messages = document.createElement('script');
      messages.src = '/messages-widget.js?v=20261002-whatsapp-1';
      messages.defer = true;
      messages.dataset.liberterraMessagesScript = 'true';
      document.head.append(messages);
    }
    window.LiberterraI18n?.apply(header);
    // Project pages use a separate translator. Follow their public lang attribute.
    if (!window.LiberterraI18n) {
      let previousLanguage;
      const translateNavigation = () => {
        const language = document.documentElement.lang.split('-')[0];
        if (language === previousLanguage) return;
        previousLanguage = language;
        const labels = {
          ru:['Купить','Снять','Новостройки','Ипотека','Заявки','Агенты'],
          ky:['Сатып алуу','Ижарага алуу','Жаңы курулуштар','Ипотека','Өтүнмөлөр','Агенттер'],
          en:['Buy','Rent','New developments','Mortgage','Requests','Agents'],
          zh:['购买','租房','新楼盘','抵押贷款','需求','经纪人']
        };
        row.querySelectorAll('.lt-navigation a').forEach((link,index) => {
          link.textContent = (labels[language] || labels.ru)[index];
        });
      };
      translateNavigation();
      new MutationObserver(translateNavigation).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();

/* The approved Liberterra wordmark and search presentation. */
(() => {
function brandAndSearch(){
 document.querySelectorAll('.lt-header .brand').forEach(brand=>{if(brand.querySelector('.lt-wordmark'))return;brand.innerHTML='<span class="lt-brand-monogram" aria-hidden="true">L<span>╱</span></span><span class="lt-wordmark">Liberterra<small>НЕДВИЖИМОСТЬ БИШКЕКА</small></span>';brand.setAttribute('aria-label','Liberterra — недвижимость Бишкека');});
 if(!document.body.classList.contains('home-redesign')||!document.querySelector('.liberterra-intro-note'))return;
 const hero=document.querySelector('.home-hero-inner'),toolbar=document.querySelector('.catalog-toolbar'),fields=document.querySelector('.catalog-primary-fields'),dealTabs=document.querySelector('.catalog-deal-tabs');
 if(!hero||!toolbar||!fields||!dealTabs||document.querySelector('.lt-search-mode-tabs'))return;
 const eyebrow=hero.querySelector('.hero-eyebrow');if(eyebrow)eyebrow.textContent='LIBERTERRA · БИШКЕК';
 const intro=hero.querySelector(':scope>p');if(intro)intro.innerHTML='Покупайте, снимайте, продавайте недвижимость<br>и находите специалистов в Бишкеке.';
 const tabs=document.createElement('div');tabs.className='lt-search-mode-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Что ищем');tabs.innerHTML='<button type="button" role="tab" aria-selected="true" aria-controls="catalogFilterOptions" id="lt-property-tab"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 10 12 3l9 7v10H3Z M9 20v-8h6v8"/></svg>Недвижимость</button><button type="button" role="tab" aria-selected="false" aria-controls="lt-specialist-panel" id="lt-specialist-tab" tabindex="-1"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M2 21v-4a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v4M16 3a4 4 0 0 1 0 8m3 2a4 4 0 0 1 3 4v4"/></svg>Специалисты</button>';
 dealTabs.hidden=true;dealTabs.before(tabs);
 const deal=document.createElement('label');deal.className='toolbar-field lt-deal-select';deal.innerHTML='<span>Я хочу</span><select aria-label="Тип сделки"><option value="продажа">Купить</option><option value="аренда">Снять</option></select>';
 const district=fields.querySelector('.district-search-field');if(district)district.after(deal);else fields.prepend(deal);
 const select=deal.querySelector('select');function sync(){select.value=dealTabs.querySelector('[aria-pressed="true"]')?.dataset.heroDeal||'продажа';}sync();new MutationObserver(sync).observe(dealTabs,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});select.addEventListener('change',()=>dealTabs.querySelector('[data-hero-deal="'+select.value+'"]').click());
 const advanced=document.querySelector('.home-advanced-content');const rooms=document.querySelector('.home-rooms-menu');if(advanced&&rooms)advanced.prepend(rooms);const currency=fields.querySelector('.currency-field');if(advanced&&currency)advanced.prepend(currency);
 const price=fields.querySelector('.price-field');const kind=fields.querySelector('.toolbar-field:has(#heroPropertyType)');if(price&&kind)price.after(kind);
 if(district){district.querySelector('span').textContent='Где';const input=district.querySelector('input');input.placeholder='Район в Бишкеке';}
 if(kind)kind.querySelector('span').textContent='Тип недвижимости';
 const currencySelect=document.querySelector('#priceCurrency');if(price){const label=price.querySelector('span');const update=()=>label.textContent='Бюджет, '+(currencySelect?.value==='usd'?'$':'сом');update();currencySelect?.addEventListener('change',update);const input=price.querySelector('input');input.placeholder='До любой суммы';}
 const show=document.querySelector('#heroShowButton');if(show){const update=()=>{if(!show.disabled&&show.firstChild?.nodeType===3&&show.firstChild.textContent.trim()!=='Поиск')show.firstChild.textContent='Поиск ';};update();new MutationObserver(update).observe(show,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['disabled']});}
 const panel=document.createElement('div');panel.id='lt-specialist-panel';panel.className='lt-specialist-panel';panel.hidden=true;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','lt-specialist-tab');panel.innerHTML='<div><strong>Специалисты Бишкека</strong><p>Профили агентов, контакты и объекты в работе.</p></div><a href="/agents.html">Найти специалиста ↗</a><a href="/profile.html">Создать профиль ↗</a>';toolbar.append(panel);
 const options=document.getElementById('catalogFilterOptions');options.setAttribute('role','tabpanel');options.setAttribute('aria-labelledby','lt-property-tab');
 function choose(index){tabs.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});options.hidden=index===1;panel.hidden=index===0;toolbar.classList.toggle('lt-specialists-active',index===1);}
 tabs.querySelectorAll('button').forEach((button,index)=>{button.addEventListener('click',()=>choose(index));button.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-index;choose(next);tabs.querySelectorAll('button')[next].focus();}});});
}
function start(){brandAndSearch();if(document.body.classList.contains('home-redesign')&&!document.querySelector('.lt-search-mode-tabs')){const observer=new MutationObserver(()=>{brandAndSearch();if(document.querySelector('.lt-search-mode-tabs'))observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();



/* Одно меню кабинета для агента: Сегодня, Клиенты, Объекты, Заявки.
   Обычному пользователю меню не меняем — у него свои Избранное и История. */
(function(){
  var MAIN = [
    ['overview', 'Рабочий стол', '/agent-cabinet.html#overview'],
    ['requests', 'Заявки', '/agent-cabinet.html#requests'],
    ['deals', 'Сделки', '/agent-cabinet.html#clients'],
    ['objects', 'Объекты', '/agent-cabinet.html#objects'],
    ['tasks', 'Задачи', '/agent-cabinet.html#tasks']
  ];
  var MORE = [
    ['profile', 'Профиль', '/profile.html'],
    ['catalog', 'Каталог', '/'],
    ['support', 'Поддержка', 'https://t.me/Liberterra_kg_bot?start=support']
  ];
  var ICONS = {
    overview: '<rect x="3.2" y="3.2" width="7.4" height="7.4" rx="1.8"/><rect x="13.4" y="3.2" width="7.4" height="7.4" rx="1.8"/><rect x="3.2" y="13.4" width="7.4" height="7.4" rx="1.8"/><rect x="13.4" y="13.4" width="7.4" height="7.4" rx="1.8"/>',
    requests: '<path d="M3.5 13.5h4.2l1.5 2.6h5.6l1.5-2.6h4.2"/><path d="M6.2 4.6h11.6l2.7 8.9v4.3a1.6 1.6 0 0 1-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6v-4.3z"/>',
    deals: '<path d="M3.4 4.6h17.2l-6.6 7.7v6.1l-4 2.3v-8.4z"/>',
    objects: '<path d="M3.6 10.8 12 3.8l8.4 7"/><path d="M5.9 9.9v9.4a.9.9 0 0 0 .9.9h10.4a.9.9 0 0 0 .9-.9V9.9"/><path d="M10 20.2v-5.1h4v5.1"/>',
    tasks: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.4"/><path d="m8.2 12.2 2.6 2.6 5-5.4"/>',
    profile: '<circle cx="12" cy="8.4" r="3.6"/><path d="M4.9 20.1c0-3.6 3.2-5.7 7.1-5.7s7.1 2.1 7.1 5.7"/>',
    catalog: '<path d="M8.6 6.2h11.8M8.6 12h11.8M8.6 17.8h11.8"/><circle cx="4.4" cy="6.2" r="1.2"/><circle cx="4.4" cy="12" r="1.2"/><circle cx="4.4" cy="17.8" r="1.2"/>',
    support: '<circle cx="12" cy="12" r="8.6"/><path d="M9.5 9.6a2.6 2.6 0 1 1 3.5 2.5c-.7.3-1 .8-1 1.5v.3"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>'
  };
  function ico(n){
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || '') + '</svg>';
  }
  function here(){ return (location.pathname || '/').replace(/\/+$/, '') || '/'; }
  function hashOk(url){
    var p = url.split('#');
    if (!p[1]) return true;
    return (location.hash || '') === '#' + p[1];
  }
  document.addEventListener('click', function(e){
    if (e.isTrusted && e.target && e.target.closest && e.target.closest('[data-crm-tab]')) {
      document.documentElement.dataset.userTab = '1';
    }
  }, true);
  function rehash(){
    var key = String(location.hash || '').replace(/^#/, '').trim();
    if (!key) return;
    if (document.documentElement.dataset.userTab === '1') return;
    if (document.documentElement.dataset.hashOpened === '1') return;
    var t = document.querySelector('[data-crm-tab="' + key + '"]');
    if (!t) return;
    document.documentElement.dataset.hashOpened = '1';
    if (!t.classList.contains('is-active')) t.click();
  }
  function fill(list, items){
    list.textContent = '';
    items.forEach(function(item){
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = item[2];
      var icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.className = 'lt-ico'; icon.innerHTML = ico(item[0]);
      a.appendChild(icon);
      a.appendChild(document.createTextNode(item[1]));
      var target = item[2].split('#')[0].replace(/\/+$/, '') || '/';
      if (target === here() && hashOk(item[2])) { a.className = 'active'; a.setAttribute('aria-current', 'page'); }
      li.appendChild(a);
      list.appendChild(li);
    });
  }
  function fillFlat(nav, items){
    nav.textContent = '';
    items.forEach(function(item){
      var a = document.createElement('a');
      a.href = item[2];
      var icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.className = 'lt-ico'; icon.innerHTML = ico(item[0]);
      a.appendChild(icon);
      a.appendChild(document.createTextNode(' ' + item[1]));
      var target = item[2].split('#')[0].replace(/\/+$/, '') || '/';
      if (target === here() && hashOk(item[2])) { a.className = 'active'; a.setAttribute('aria-current', 'page'); }
      nav.appendChild(a);
    });
  }
  var wipeTimer = null;
  function wipe(){ try { localStorage.removeItem('lt-agent-menu'); localStorage.removeItem('lt-crm-cache-v1'); localStorage.removeItem('lt-dashboard-cache-v1'); } catch (e) {} }
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('a,button') : null;
    if (b && /^\s*(Выйти|Чыгуу|Log out|Sign out)\s*$/i.test(b.textContent || '')) wipe();
  }, true);
  function role(){
    var r = document.documentElement.getAttribute('data-agent-role');
    try {
      if (r === 'approved') { if (wipeTimer) { clearTimeout(wipeTimer); wipeTimer = null; } localStorage.setItem('lt-agent-menu', '1'); }
      else if (r) { if (!wipeTimer) wipeTimer = setTimeout(function(){ wipeTimer = null; if (document.documentElement.getAttribute('data-agent-role') !== 'approved') wipe(); }, 20000); if (localStorage.getItem('lt-agent-menu') === '1') return 'approved'; }
      else if (localStorage.getItem('lt-agent-menu') === '1') return 'approved';
    } catch (e) {}
    return r;
  }
  function cabinet(){
    var nav = document.getElementById('crmCompactNavigation');
    if (!nav || nav.dataset.agentNav === '1') return;
    var order = [
      ['workspace-overview-tab', 'overview', 'Рабочий стол'],
      ['workspace-requests-tab', 'requests', 'Заявки'],
      ['crmClientsTab', 'deals', 'Сделки'],
      ['crmObjectsTab', 'objects', 'Объекты'],
      ['workspace-tasks-tab', 'tasks', 'Задачи']
    ];
    var cap = nav.querySelector('.crm-sidebar-caption');
    var foot = nav.querySelector('.crm-sidebar-footer');
    if (!cap || !foot) return;
    var btns = [];
    for (var k = 0; k < order.length; k++) {
      var b = document.getElementById(order[k][0]);
      if (!b) return;
      btns.push(b);
    }
    nav.dataset.agentNav = '1';
    document.documentElement.removeAttribute('data-agent-menu-pending');
    if (!document.getElementById('agent-early-tabs')) {
      var early = document.createElement('style');
      early.id = 'agent-early-tabs';
      early.textContent = '#crmCompactNavigation .crm-tab:not(#workspace-overview-tab):not(#crmClientsTab):not(#crmObjectsTab):not(#workspace-requests-tab):not(#workspace-tasks-tab){display:none!important}'
        + '#crmCompactNavigation #workspace-overview-tab,#crmCompactNavigation #workspace-requests-tab,#crmCompactNavigation #crmClientsTab,#crmCompactNavigation #crmObjectsTab,#crmCompactNavigation #workspace-tasks-tab{display:flex!important}'
        + '#crmCompactNavigation .crm-tab,#crmCompactNavigation .crm-sidebar-footer a{align-items:center;gap:10px;font-size:16px!important;font-weight:500!important;line-height:1.25!important;padding:9px 11px!important;border-radius:9px;letter-spacing:0!important}'
        + '#crmCompactNavigation .crm-sidebar-footer a{display:flex!important}'
        + '#crmCompactNavigation .crm-sidebar-caption{font-size:12px!important;font-weight:600!important;letter-spacing:.09em!important;opacity:.52;padding:16px 11px 6px!important}'
        + '#crmCompactNavigation .lt-ico{flex:0 0 18px;width:18px;height:18px;display:block;opacity:.9}'
        + '#crmCompactNavigation .lt-ico svg{width:18px;height:18px;display:block}';
      document.head.appendChild(early);
    }
    var content = document.querySelector('[data-crm-content]');
    if (content && nav.parentElement === content) content.parentElement.insertBefore(nav, content);
    cap.textContent = 'Основное';
    var anchor = cap;
    btns.forEach(function(b, idx){
      b.removeAttribute('hidden');
      b.textContent = '';
      var s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      s.className = 'lt-ico'; s.innerHTML = ico(order[idx][1]);
      b.appendChild(s);
      b.appendChild(document.createTextNode(' ' + order[idx][2]));
      nav.insertBefore(b, anchor.nextSibling);
      anchor = b;
    });
    var cap2 = cap.cloneNode(false);
    cap2.textContent = 'Ещё';
    nav.insertBefore(cap2, foot);
    foot.textContent = '';
    MORE.forEach(function(item){
      var a = document.createElement('a');
      a.href = item[2];
      var ic = document.createElement('span');
      ic.setAttribute('aria-hidden', 'true');
      ic.className = 'lt-ico'; ic.innerHTML = ico(item[0]);
      a.appendChild(ic);
      a.appendChild(document.createTextNode(' ' + item[1]));
      foot.appendChild(a);
    });
  }
  function apply(){
    if (role() !== 'approved') return;
    cabinet();
    var an = document.getElementById('crmCompactNavigation');
    if (an && an.dataset.agentNav === '1') ['workspace-overview-tab','workspace-requests-tab','crmClientsTab','crmObjectsTab','workspace-tasks-tab'].forEach(function(id){ var tb = document.getElementById(id); if (tb && tb.hasAttribute('hidden')) tb.removeAttribute('hidden'); });
    var lists = document.querySelectorAll('.pv2-sidebar-nav');
    var shell = document.querySelector('.owner-object-shell');
    if (!lists.length && !shell) return;
    if (document.documentElement.dataset.agentNavApplied === '1') return;
    document.documentElement.dataset.agentNavApplied = '1';
    if (lists.length) {
      fill(lists[0], MAIN);
      if (lists[1]) fill(lists[1], MORE);
      var caps = document.querySelectorAll('.pv2-sidebar-section');
      if (caps[1]) caps[1].textContent = 'Ещё';
    }
    if (shell) {
      var navs = shell.querySelectorAll('nav');
      if (navs[0]) fillFlat(navs[0], MAIN);
      if (navs[1]) fillFlat(navs[1], MORE);
      var groups = shell.querySelectorAll('.owner-object-group');
      if (groups[1]) groups[1].textContent = 'Ещё';
      var omob = document.querySelector('.owner-object-mobile-nav');
      if (omob) fillFlat(omob, MAIN);
    }
    var mobile = document.querySelector('.pv2-mobile-nav');
    if (mobile) {
      mobile.textContent = '';
      MAIN.forEach(function(item){
        var a = document.createElement('a');
        a.href = item[2];
        var icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.className = 'lt-ico'; icon.innerHTML = ico(item[0]);
        a.appendChild(icon);
        a.appendChild(document.createTextNode(item[1]));
        var target = item[2].split('#')[0].replace(/\/+$/, '') || '/';
        if (target === here() && hashOk(item[2])) { a.className = 'active'; a.setAttribute('aria-current', 'page'); }
        mobile.appendChild(a);
      });
    }
  }
  apply();
  var fastN = 0, fast = setInterval(function(){ apply(); if (++fastN > 60) clearInterval(fast); }, 50);
  window.addEventListener('liberterra:agent-role', apply);
  document.addEventListener('DOMContentLoaded', apply);
  setTimeout(apply, 700);
  setTimeout(apply, 2200);
  setTimeout(apply, 5000);
  setTimeout(apply, 9000);
  setTimeout(apply, 14000);
  setTimeout(rehash, 4000);
  setTimeout(rehash, 8000);
  setTimeout(rehash, 13000);
})();

/* Ранний параллельный запрос CRM. Кабинет ждёт панель от Apps Script 10-23 с,
   а данные CRM можно грузить одновременно: точка подключения есть в crm-workflow.js. */
(function(){
  if (location.pathname.indexOf('/agent-cabinet.html') !== 0) return;
  var known = document.documentElement.getAttribute('data-agent-role') === 'approved';
  try { if (!known) known = localStorage.getItem('lt-agent-menu') === '1'; } catch (e) {}
  if (!known) return;
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) return;
  var p = fetch('/api/crm-action', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_crm_workflow' }),
    signal: AbortSignal.timeout(30000)
  }).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(j){
      if (!r.ok || !j.ok) {
        var e = new Error(j.message || 'Не удалось выполнить запрос CRM.');
        e.code = j.error || 'crm_service_unavailable';
        throw e;
      }
      return j;
    });
  });
  var KEY = 'lt-crm-cache-v1';
  function readCache(){
    try {
      var r = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (r && Date.now() - r.t < 86400000) return r.v;
    } catch (e) {}
    return null;
  }
  function writeCache(v){
    try {
      var s = JSON.stringify({ t: Date.now(), v: v });
      if (s.length < 1000000) localStorage.setItem(KEY, s);
    } catch (e) {}
  }
  p.then(writeCache).catch(function(){});
  window.LiberterraCrmEarly = {
    take: function(){
      var cached = readCache();
      if (cached) {
        p.then(function(j){
          window.LiberterraCrmEarly = { take: function(){ window.LiberterraCrmEarly = null; return Promise.resolve(j); } };
          if (window.LiberterraCrmWorkflow) window.LiberterraCrmWorkflow.reload();
        }).catch(function(){ window.LiberterraCrmEarly = null; });
        return Promise.resolve(cached);
      }
      window.LiberterraCrmEarly = null;
      return p.catch(function(){ return window.LiberterraAgentAccess.request('list_crm_workflow'); });
    }
  };
})();


/* === Объект и профиль открываются внутри кабинета, без перезагрузки === */
(function(){
  if (window.self !== window.top) return;
  if ((location.pathname || '').indexOf('/agent-cabinet.html') !== 0) return;

  var SHELL = '.lt-frame-panel{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}'
    + '.lt-frame-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:2px 0 12px}'
    + '.lt-frame-back{appearance:none;-webkit-appearance:none;border:1px solid rgba(0,0,0,.14);background:#fff;color:inherit;font:inherit;font-size:15px;padding:8px 14px;border-radius:10px;cursor:pointer}'
    + '.lt-frame-back:hover{background:#f2f0ed}'
    + '.lt-frame-title{font-weight:600;font-size:17px}'
    + '.lt-frame-ext{margin-left:auto;font-size:14px;opacity:.65;text-decoration:none;color:inherit}'
    + '.lt-frame-wrap{position:relative;min-height:280px}'
    + '.lt-frame{width:100%;border:0;display:block;background:transparent;transition:opacity .18s ease}'
    + '.lt-frame-spin{position:absolute;left:0;right:0;top:40px;text-align:center;font-size:15px;opacity:.6}'
    + 'body.lt-frame-open .crm-workflow-toolbar,body.lt-frame-open .crm-request-notice{display:none!important}';

  var HIDE = ['.public-header','.public-footer','.owner-object-shell','.owner-object-mobile-nav','.app-bottom-nav','.pv2-mobile-nav','.profile-v2-sidebar','.back-link','.pv2-mobile-header','.pv2-topbar .lt-theme-toggle','.pv2-back-to-site','.pv2-page-title','.pv2-page-summary','.pv2-stats-grid','.pv2-quick-actions','.profile-help-menu'];
  var INNER = '';
  for (var q = 0; q < HIDE.length; q++) INNER += (q ? ',' : '') + 'html.lt-embed body ' + HIDE[q] + ':not(#lt0)';
  INNER += '{display:none!important}'
    + 'html.lt-embed body:not(#lt0){background:transparent!important}'
    + 'html.lt-embed body .profile-v2-layout:not(#lt0){display:block!important;min-height:0!important}'
    + 'html.lt-embed body .profile-v2-main:not(#lt0){max-width:none!important;margin:0!important;padding:0 0 24px!important}'
    + 'html.lt-embed body main.object-page:not(#lt0){padding-top:0!important}'
    + 'html.lt-embed body .pv2-topbar:not(#lt0){justify-content:flex-end!important;border:0!important;padding:0 0 4px!important;min-height:0!important}';

  function styles(){
    if (document.getElementById('lt-frame-styles')) return;
    var s = document.createElement('style');
    s.id = 'lt-frame-styles';
    s.textContent = SHELL;
    (document.head || document.documentElement).appendChild(s);
  }
  function content(){ return document.querySelector('[data-crm-content]'); }

  function panel(kind, backLabel){
    var c = content(); if (!c) return null;
    var id = 'lt-frame-' + kind;
    var p = document.getElementById(id);
    if (p) return p;
    styles();
    p = document.createElement('section');
    p.id = id;
    p.className = 'crm-panel lt-frame-panel';
    p.setAttribute('data-crm-panel', kind);
    p.setAttribute('hidden', '');
    var bar = document.createElement('div'); bar.className = 'lt-frame-bar';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'lt-frame-back'; back.textContent = backLabel;
    back.addEventListener('click', function(){ shut(kind); });
    var ttl = document.createElement('span'); ttl.className = 'lt-frame-title';
    var ext = document.createElement('a'); ext.className = 'lt-frame-ext'; ext.target = '_blank'; ext.rel = 'noopener'; ext.textContent = 'Отдельной страницей';
    bar.appendChild(back); bar.appendChild(ttl); bar.appendChild(ext);
    var wrap = document.createElement('div'); wrap.className = 'lt-frame-wrap';
    var spin = document.createElement('div'); spin.className = 'lt-frame-spin'; spin.textContent = 'Загружаю…';
    var f = document.createElement('iframe'); f.className = 'lt-frame';
    wrap.appendChild(spin); wrap.appendChild(f);
    p.appendChild(bar); p.appendChild(wrap);
    c.appendChild(p);
    try {
      new MutationObserver(function(){
        if (p.hasAttribute('hidden')) document.body.classList.remove('lt-frame-open');
      }).observe(p, { attributes: true, attributeFilter: ['hidden'] });
    } catch (e) {}
    return p;
  }

  function dress(f){
    try {
      var d = f.contentDocument;
      if (!d || !d.documentElement) return;
      d.documentElement.classList.add('lt-embed');
      if (!d.getElementById('lt-embed-styles')) {
        var s = d.createElement('style'); s.id = 'lt-embed-styles'; s.textContent = INNER;
        (d.head || d.documentElement).appendChild(s);
      }
    } catch (e) {}
  }

  function fit(f){
    try {
      var d = f.contentDocument;
      if (!d || !d.body) return;
      var prev = f.style.height;
      f.style.height = '0px';
      var h = Math.max(d.body.scrollHeight || 0, d.documentElement.scrollHeight || 0);
      if (!(h > 160)) { f.style.height = prev; return; }
      f.style.height = (h + 24) + 'px';
    } catch (e) {}
  }

  function label(f, p){
    try {
      var d = f.contentDocument;
      var t = d && d.title ? String(d.title) : '';
      t = t.replace(/\s*[—–-]\s*Liberterra\s*$/, '').trim();
      if (t) p.querySelector('.lt-frame-title').textContent = t;
    } catch (e) {}
  }

  function show(kind, url, title, backLabel){
    var p = panel(kind, backLabel); if (!p) return;
    var c = content();
    var f = p.querySelector('.lt-frame');
    var spin = p.querySelector('.lt-frame-spin');
    p.querySelector('.lt-frame-title').textContent = title || '';
    p.querySelector('.lt-frame-ext').setAttribute('href', url);
    var els = c.querySelectorAll('[data-crm-panel]');
    for (var i = 0; i < els.length; i++) if (els[i] !== p) els[i].setAttribute('hidden', '');
    var tabs = document.querySelectorAll('.crm-tab');
    for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('is-active');
    p.removeAttribute('hidden');
    document.body.classList.add('lt-frame-open');
    try { window.scrollTo(0, 0); } catch (e) {}
    if (f.getAttribute('data-lt-src') === url) { dress(f); label(f, p); fit(f); return; }
    f.setAttribute('data-lt-src', url);
    f.style.opacity = '0';
    f.style.height = '320px';
    spin.hidden = false;
    f.addEventListener('load', function(){
      dress(f); label(f, p); fit(f);
      spin.hidden = true;
      f.style.opacity = '1';
      var n = 0;
      var iv = setInterval(function(){ dress(f); label(f, p); fit(f); if (++n > 60) clearInterval(iv); }, 400);
      try {
        var d = f.contentDocument;
        if (d && window.ResizeObserver) new ResizeObserver(function(){ fit(f); }).observe(d.body);
      } catch (e) {}
    }, { once: true });
    f.src = url;
  }

  function shut(kind){
    document.body.classList.remove('lt-frame-open');
    var b = document.getElementById(kind === 'profile' ? 'workspace-overview-tab' : 'crmObjectsTab');
    if (b) { b.click(); return; }
    var p = document.getElementById('lt-frame-' + kind);
    if (p) p.setAttribute('hidden', '');
  }

  window.LiberterraShell = { open: show };
  function fromHash(tries){
    if (String(location.hash || '') !== '#profile') return;
    if (!content()) {
      if ((tries || 0) < 80) setTimeout(function(){ fromHash((tries || 0) + 1); }, 250);
      return;
    }
    var opened = document.getElementById('lt-frame-profile');
    if (opened && !opened.hasAttribute('hidden')) return;
    show('profile', '/profile.html', '\u041f\u0440\u043e\u0444\u0438\u043b\u044c', '\u2190 \u041d\u0430\u0437\u0430\u0434');
  }
  try { window.addEventListener('hashchange', function(){ fromHash(0); }); } catch (e) {}
  setTimeout(function(){ fromHash(0); }, 200);
  var guardN = 0, guardOn = true;
  document.addEventListener('click', function(e){ if (e.isTrusted) guardOn = false; }, true);
  var guard = setInterval(function(){
    if (!guardOn || ++guardN > 60 || String(location.hash || '') !== '#profile') { clearInterval(guard); return; }
    fromHash(0);
  }, 500);
  document.addEventListener('click', function(ev){
    if (ev.defaultPrevented || ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var t = ev.target;
    if (!t || !t.closest) return;
    var a = t.closest('a[href]');
    if (!a) return;
    if (a.target && a.target !== '_self') return;
    if (a.classList.contains('lt-frame-ext')) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('/object.html') === 0 && href.indexOf('id=') > 0) {
      ev.preventDefault();
      show('object', href, 'Объект', '← К объектам');
      return;
    }
    if (href === '/profile.html' || href.indexOf('/profile.html?') === 0 || href === '/agent-cabinet.html#profile' || href === '#profile') {
      ev.preventDefault();
      show('profile', '/profile.html', 'Профиль', '← Назад');
    }
  }, true);
})();

/* === Один каркас: профиль живёт внутри кабинета, а не отдельной страницей === */
(function(){
  if (window.self !== window.top) return;
  function agent(){
    var r = document.documentElement.getAttribute('data-agent-role');
    if (r === 'approved') return true;
    if (r) return false;
    try { return localStorage.getItem('lt-agent-menu') === '1'; } catch (e) { return false; }
  }
  if ((location.pathname || '').indexOf('/profile.html') === 0 && agent()) {
    location.replace('/agent-cabinet.html#profile');
    return;
  }
  function rewrite(){
    if (!agent()) return;
    var links = document.querySelectorAll('a[href="/profile.html"]');
    for (var i = 0; i < links.length; i++) links[i].setAttribute('href', '/agent-cabinet.html#profile');
  }
  rewrite();
  document.addEventListener('DOMContentLoaded', rewrite);
  window.addEventListener('liberterra:agent-role', rewrite);
  setTimeout(rewrite, 700);
  setTimeout(rewrite, 2500);
  setTimeout(rewrite, 6000);
  setTimeout(rewrite, 12000);
})();

/* === Вид кабинета: светлое меню и рабочий стол === */
(function(){
  if (window.self !== window.top) return;
  if ((location.pathname || '').indexOf('/agent-cabinet.html') !== 0) return;
  if (document.getElementById('lt-cabinet-look')) return;
  var s = document.createElement('style');
  s.id = 'lt-cabinet-look';
  s.textContent = 'html[data-theme="light"] #crmCompactNavigation:not(#lt0){background:#F3F1EC!important;color:#3A4049!important;border-right:1px solid rgba(0,0,0,.08)!important;box-shadow:none!important}html[data-theme="light"] #crmCompactNavigation .crm-tab,html[data-theme="light"] #crmCompactNavigation .crm-sidebar-footer a{color:#3A4049!important;background:transparent!important;box-shadow:none!important}html[data-theme="light"] #crmCompactNavigation .crm-tab:hover,html[data-theme="light"] #crmCompactNavigation .crm-sidebar-footer a:hover{background:rgba(0,0,0,.05)!important}html[data-theme="light"] #crmCompactNavigation .crm-tab.is-active{background:#fff!important;color:#1F242B!important;box-shadow:0 0 0 1px rgba(0,0,0,.08)!important}html[data-theme="light"] #crmCompactNavigation .crm-tab.is-active .lt-ico{color:#BE2C28;opacity:1}html[data-theme="light"] #crmCompactNavigation .crm-sidebar-caption{color:#8C8F94!important;opacity:1!important}html[data-theme="light"] #crmCompactNavigation .crm-sidebar-footer{border-top-color:rgba(0,0,0,.08)!important}html[data-theme="light"] #crmCompactNavigation .crm-sidebar-footer a{color:#6A7078!important}html[data-theme="light"] body.agent-crm-page .crm-menu-toggle:not(#lt0){background:#F3F1EC!important;color:#1F242B!important;border-bottom:1px solid rgba(0,0,0,.08)!important;box-shadow:none!important}#workspace-overview:not([hidden]){display:flex!important;flex-direction:column;gap:14px}#workspace-overview >.crm-secondary-button{order:5;align-self:flex-start;font-size:15px!important;font-weight:500!important;min-height:0!important;padding:8px 12px!important}#workspace-overview .crm-home{order:1;display:grid!important;gap:14px!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important}#workspace-overview .crm-home-heading{display:flex!important;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:#fff;border:1px solid #e7e4df;border-radius:14px;padding:16px 18px!important}#workspace-overview #crm-home-title{font-size:20px!important;font-weight:700!important;margin:0 0 4px!important}#workspace-overview .crm-home-finding{font-size:16px!important;line-height:1.45!important;color:#5B636E;margin:0!important;padding:0!important;border:0!important;background:none!important}#workspace-overview .crm-home-primary{font-size:16px!important;font-weight:600!important;padding:10px 16px!important;min-height:0!important;width:auto!important;border-radius:10px!important;flex:0 0 auto}#workspace-overview .crm-home-metrics{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important}#workspace-overview .crm-home-metric{background:#fff;border:1px solid #e7e4df;border-radius:14px!important;padding:14px 16px!important;display:flex!important;flex-direction:column;gap:6px;min-height:0!important}#workspace-overview .crm-home-metric span{font-size:15px!important;font-weight:500!important;color:#5B636E}#workspace-overview .crm-home-metric strong{font-size:30px!important;font-weight:700!important;line-height:1.1!important}#workspace-overview .crm-home-actions{display:flex!important;gap:10px!important;flex-wrap:wrap}#workspace-overview .crm-home-action{font-size:16px!important;font-weight:600!important;padding:9px 14px!important;min-height:0!important;width:auto!important;flex:0 0 auto!important;border-radius:10px!important}#workspace-overview .crm-counters{order:2;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}#workspace-overview .crm-counter{padding:12px 16px!important;border-radius:14px!important;display:flex!important;flex-direction:row-reverse;justify-content:space-between;align-items:center;min-height:0!important}#workspace-overview .crm-counter strong{font-size:22px!important;font-weight:700!important}#workspace-overview .crm-counter span{font-size:15px!important;font-weight:500!important;color:#5B636E}#workspace-overview .concept-roadmap{order:6}#workspace-overview .concept-roadmap summary{font-size:15px!important;font-weight:500!important}#workspace-overview .concept-roadmap p{font-size:15px!important;line-height:1.5!important}#workspace-overview .crm-home,#workspace-overview .crm-counters,#workspace-overview .crm-home-actions,#workspace-overview .crm-home-metrics{margin:0!important}#workspace-overview .crm-counters::before{content:"Мои объявления";grid-column:1/-1;font-size:15px;font-weight:600;color:#5B636E;margin-top:6px}[data-crm-content]:has(#workspace-overview:not([hidden])) .crm-request-notice{display:none!important}body.agent-crm-page .crm-workflow-toolbar{font-size:15px!important}body.agent-crm-page .crm-workflow-toolbar button{font-size:15px!important;font-weight:500!important;padding:7px 12px!important;min-height:0!important}html[data-theme="dark"] #workspace-overview .crm-home-heading,html[data-theme="dark"] #workspace-overview .crm-home-metric{background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.14)!important}html[data-theme="dark"] #workspace-overview .crm-home-finding,html[data-theme="dark"] #workspace-overview .crm-home-metric span,html[data-theme="dark"] #workspace-overview .crm-counter span,html[data-theme="dark"] #workspace-overview .crm-counters::before{color:#A9B0B9!important}@media(max-width:900px){#workspace-overview .crm-home-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}#workspace-overview .crm-counters{grid-template-columns:1fr!important}#workspace-overview .crm-home-primary{width:100%!important}}';
  (document.head || document.documentElement).appendChild(s);
})();

/* === Единая шкала шрифтов в разделах кабинета === */
(function(){
  if (window.self !== window.top) return;
  if ((location.pathname || '').indexOf('/agent-cabinet.html') !== 0) return;
  if (document.getElementById('lt-cabinet-type')) return;
  var s = document.createElement('style');
  s.id = 'lt-cabinet-type';
  s.textContent = 'body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) h2{font-size:20px!important;font-weight:700!important;line-height:1.3!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) h3{font-size:17px!important;font-weight:600!important;line-height:1.35!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) p,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) span,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) li{font-size:16px!important;line-height:1.45!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) input,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) select,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) textarea{font-size:16px!important;font-weight:400!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) label{font-size:15px!important;font-weight:500!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) button,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) a.crm-primary-link{font-size:16px!important;line-height:1.25!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-secondary-button,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-text-button{font-weight:500!important;padding:8px 12px!important;min-height:0!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-primary-button,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) a.crm-primary-link{font-weight:600!important;padding:9px 14px!important;min-height:0!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-eyebrow{font-size:13px!important;font-weight:600!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-request-time,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-actuality,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-deal-muted,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-deal-empty{font-size:15px!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-object-price{font-size:22px!important;font-weight:700!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-status,body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-work-stage{font-size:13px!important;font-weight:600!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) .crm-task-summary{font-size:16px!important;font-weight:500!important}body.agent-crm-page [data-crm-content] .crm-panel:not(#workspace-overview) strong{font-weight:600}body.agent-crm-page [data-crm-content] .crm-request-notice:not(#lt0) p,body.agent-crm-page [data-crm-content] .crm-request-notice:not(#lt0) span,body.agent-crm-page [data-crm-content] .crm-request-notice:not(#lt0) strong,body.agent-crm-page [data-crm-content] .crm-request-notice:not(#lt0) div{font-size:16px!important;line-height:1.45!important}body.agent-crm-page [data-crm-content] .crm-request-notice:not(#lt0) button,body.agent-crm-page [data-crm-content] .crm-request-notice:not(#lt0) a{font-size:15px!important;font-weight:500!important;padding:7px 12px!important;min-height:0!important}';
  (document.head || document.documentElement).appendChild(s);
})();

/* === Раздел «Сделки»: воронка первой === */
(function(){
  if (window.self !== window.top) return;
  if ((location.pathname || '').indexOf('/agent-cabinet.html') !== 0) return;
  if (document.getElementById('lt-cabinet-deals')) return;
  var s = document.createElement('style');
  document.addEventListener('click', function(ev){
    var t = ev.target; if (!t || !t.closest) return;
    if (!t.closest('.crm-home-primary') && !t.closest('#crm-deals-tab')) return;
    var c = document.getElementById('crmClientsTab'); if (!c) return;
    ev.preventDefault(); ev.stopPropagation();
    c.click();
    try { window.scrollTo(0, 0); } catch (e) {}
  }, true);
  s.id = 'lt-cabinet-deals';
  var fit = document.createElement('style');
  fit.id = 'lt-deal-board-fit';
  fit.textContent = '#crmClientsPanel .crm-deal-board{grid-auto-columns:minmax(0,1fr)!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:10px!important;overflow-x:visible!important}#crmClientsPanel .crm-deal-board>.crm-deal-column{min-width:0!important;width:auto!important;padding:12px 10px!important}#crmClientsPanel .crm-deal-column h3{font-size:14px!important;font-weight:600!important;line-height:1.3!important}#crmClientsPanel .crm-deal-column[data-terminal="true"]{opacity:.75}#crmClientsPanel .crm-deal-empty{font-size:12px!important}';
  (document.head || document.documentElement).appendChild(fit);
  s.textContent = '#crmClientsPanel:not([hidden]){display:flex!important;flex-direction:column}#crmClientsPanel>.crm-deal-heading{order:1}#crmClientsPanel>.crm-workflow-status{order:2}#crmClientsPanel>.crm-deal-tools{order:3}#crmClientsPanel>.crm-stage-rail{order:4}#crmClientsPanel>.crm-deal-board{order:5}#crmClientsPanel>.crm-deal-list-view{order:6}#crmClientsPanel>.crm-client-workflow{order:10;margin-top:28px!important}#crmClientsPanel>h2{order:20;margin-top:28px!important}#crmClientsPanel>p:not(.crm-workflow-status){order:21}#crmClientsPanel>form{order:22}#crmClientsPanel>.crm-small-button{order:23;align-self:flex-start}#crmClientsPanel>.crm-workflow-list{order:24}#crmClientsPanel>.crm-panel-heading{order:30;margin-top:28px!important}#crmClientsPanel>.crm-client-list{order:31}#crmClientsPanel>.crm-deal-heading .crm-eyebrow{display:none!important}';
  (document.head || document.documentElement).appendChild(s);
})();
