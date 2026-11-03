/* Copy only: the existing catalogue owns filtering, currency, data and access. */
(() => {
  const presentation = {
    ru:['Купить, продать, снять или сдать','Недвижимость в Кыргызстане. Смотрите объекты и заявки: найдите жильё или узнайте, что ищут покупатели и арендаторы.','Найти недвижимость ↗','Разместить объект','Оставить заявку','Показать все объявления','Показать первые 6','LIBERTERRA · КЫРГЫЗСТАН'],
    en:['Buy, sell, rent or let','Property in Kyrgyzstan. Explore listings and requests to find a home or see what buyers and tenants need.','Find property ↗','List a property','Post a request','Show all listings','Show first 6','LIBERTERRA · KYRGYZSTAN'],
    ky:['Сатып алуу, сатуу же ижара','Кыргызстандагы кыймылсыз мүлк. Үй табуу же сатып алуучулар менен ижарачылардын суроо-талаптарын көрүү үчүн жарыяларды караңыз.','Кыймылсыз мүлк табуу ↗','Объект жарыялоо','Өтүнмө калтыруу','Бардык жарыялар','Алгачкы 6 жарыя','LIBERTERRA · КЫРГЫЗСТАН'],
    zh:['购买、出售或租赁','吉尔吉斯斯坦房地产。浏览房源与需求，寻找住房或了解买家和租客的需求。','查找房源 ↗','发布房源','发布需求','显示全部房源','显示前6个','LIBERTERRA · 吉尔吉斯斯坦']
  };
  function compose() {
    if (!document.body.classList.contains('home-redesign') || !document.body.classList.contains('concept-v20')) return;
    const hero=document.querySelector('.home-hero-inner'), fields=document.querySelector('.catalog-primary-fields'), advanced=document.querySelector('.home-advanced-content');
    if(!hero||!fields||!advanced||hero.dataset.conceptComposed)return;
    hero.dataset.conceptComposed='true';
    const rooms=fields.querySelector('.home-rooms-menu');if(rooms)advanced.prepend(rooms);
    const quick=document.querySelector('#quickCollections');if(quick)advanced.append(quick);
    const price=fields.querySelector('.price-field'), currency=fields.querySelector('.currency-field');
    if(price&&currency){const row=document.createElement('div');row.className='concept-price-row';price.replaceWith(row);row.append(price,currency);}
    const actions=hero.querySelector('.hero-actions');
    if(actions){actions.replaceChildren();for(const [cls,href,key] of [['concept-find','#catalogGrid',2],['concept-post','/add-object.html',3],['concept-request','/add-request.html',4]]){const a=document.createElement('a');a.className=cls;a.href=href;a.dataset.v20Text=key;actions.append(a);}const cabinet=hero.querySelector('.concept-workspace-link');if(cabinet)actions.append(cabinet);}
    const title=hero.querySelector('h1'), intro=hero.querySelector(':scope > p'), eyebrow=hero.querySelector('.hero-eyebrow');
    if(title)title.dataset.v20Text='0';if(intro)intro.dataset.v20Text='1';if(eyebrow)eyebrow.dataset.v20Text='7';
    const grid=document.querySelector('#catalogGrid');
    if(grid){grid.classList.add('concept-preview');const more=document.createElement('button');more.type='button';more.className='concept-show-all';more.setAttribute('aria-controls','catalogGrid');more.setAttribute('aria-expanded','false');grid.after(more);const sync=()=>{more.hidden=grid.querySelectorAll(':scope > .card').length<=6;more.dataset.v20Text=grid.classList.contains('concept-expanded')?'6':'5';const language=window.LiberterraI18n?.language||'ru';more.textContent=(presentation[language]||presentation.ru)[Number(more.dataset.v20Text)];};more.addEventListener('click',()=>{const expanded=grid.classList.toggle('concept-expanded');more.setAttribute('aria-expanded',String(expanded));sync();});new MutationObserver(sync).observe(grid,{childList:true});sync();}
  }
  const copy = {
    ru: ['Актуальные объявления', 'Лучшие объявления', 'Подборка появится после подключения подтверждённого отбора. Все доступные объявления — в каталоге выше.', 'Кабинет агента →'],
    en: ['Current listings', 'Featured listings', 'This selection will appear when a verified selection process is connected. All available listings are in the catalogue above.', 'Agent workspace →'],
    ky: ['Актуалдуу жарыялар', 'Мыкты жарыялар', 'Тандоо текшерилген тандоо тартиби кошулгандан кийин пайда болот. Жеткиликтүү жарыялар жогорудагы каталогдо.', 'Агенттин кабинети →'],
    zh: ['最新房源', '精选房源', '接入经过确认的筛选流程后，这里将显示精选房源。所有可用房源均在上方目录中。', '经纪人工作台 →']
  };
  function update() {
    compose();
    if (document.body.classList.contains('concept-v20')) {
      const brand = document.querySelector('.brand');
      if (brand && !brand.querySelector('.brand-wordmark')) {
        const wordmark = document.createElement('span');
        wordmark.className = 'brand-wordmark lt-wordmark';
        wordmark.textContent = 'Liberterra';
        brand.replaceChildren(wordmark);
      }
    }
    const language = window.LiberterraI18n?.language || document.documentElement.lang;
    const text = copy[language] || copy.ru;
    document.querySelectorAll('[data-v20-text]').forEach(node=>{node.setAttribute('translate','no');node.textContent=(presentation[language]||presentation.ru)[Number(node.dataset.v20Text)];});
    ['current', 'best', 'pending', 'cabinet'].forEach((key, index) => {
      document.querySelectorAll(`[data-concept-copy="${key}"]`).forEach(node => {
        node.setAttribute('translate', 'no');
        if (node.textContent !== text[index]) node.textContent = text[index];
      });
    });
  }
  document.addEventListener('DOMContentLoaded', update, {once:true});
  window.addEventListener('liberterra:languagechange', update);
  window.addEventListener('storage', update);
})();
