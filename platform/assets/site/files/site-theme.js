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

