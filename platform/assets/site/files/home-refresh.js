/* Homepage composition only. Reuse existing controls and their listeners. */
(() => {
  "use strict";
  if (!document.body.classList.contains("home-redesign")) return;
  const hero = document.querySelector(".home-hero-inner");
  const toolbar = document.querySelector(".catalog-toolbar");
  const fields = document.querySelector(".catalog-primary-fields");
  if (!hero || !toolbar || !fields) return;
  hero.append(toolbar);
  toolbar.classList.remove("wrap");

  const rooms = document.querySelector(".toolbar-group.rooms");
  if (rooms) {
    const oldRow = rooms.parentElement;
    const menu = document.createElement("details");
    menu.id = "heroRoomsMenu";
    menu.className = "home-rooms-menu";
    menu.innerHTML = '<summary><small>Комнат</small><span>Комнаты</span></summary>';
    menu.append(rooms);
    fields.insertBefore(menu, fields.querySelector(".price-field"));
    oldRow.remove();
    menu.addEventListener("keydown", event => {
      if (event.key === "Escape") { menu.open = false; menu.querySelector("summary").focus(); }
    });
    document.addEventListener("click", event => {
      if (!menu.contains(event.target)) menu.open = false;
    });
  }
  // Native input/select elements retain their IDs, values and listeners.
  const district = fields.querySelector(".district-search-field");
  if (district) fields.prepend(district);
  const show = document.querySelector("#heroShowButton");
  if (show) {
    fields.append(show);
    const requestAction = document.createElement("a");
    requestAction.className = "home-mobile-search-request";
    requestAction.href = "/add-request.html";
    requestAction.textContent = "Оставить заявку на поиск";
    fields.append(requestAction);
  }
  const options = document.querySelector("#catalogFilterOptions");
  const advanced = document.createElement("details");
  advanced.className = "home-advanced";
  advanced.innerHTML = '<summary>Дополнительные фильтры</summary><div class="home-advanced-content"></div>';
  const advancedContent = advanced.querySelector("div");
  for (const element of [...options.children]) {
    if (element !== fields) advancedContent.append(element);
  }
  options.append(advanced);
  // Daily rental is not offered in the approved homepage design.
  const term = document.querySelector("#rentTermGroup");
  if (term) term.classList.add("home-unused-term");
  const quick = document.querySelector("#quickCollections");
  if (quick) toolbar.append(quick);

  const controls = document.querySelector(".header-controls");
  const favorite = document.querySelector("#favoritesFilter");
  if (favorite && controls) {
    favorite.setAttribute("aria-label", "Избранное");
    favorite.setAttribute("title", "Избранное");
    favorite.textContent = "♡";
    controls.prepend(favorite);
  }
  const nav = document.querySelector(".home-navigation");
  if (nav && controls) {
    const menu = document.createElement("details");
    menu.className = "home-mobile-menu";
    menu.innerHTML = '<summary aria-label="Меню">☰</summary><div></div>';
    const panel = menu.querySelector("div");
    // Build from source-language labels, not already translated desktop nodes.
    // Otherwise a saved EN/ZH preference becomes the clone's original text.
    panel.innerHTML = '<a href="/newbuildings.html">Новостройки</a><a href="/agents.html">Агенты</a>';
    const requestLink = document.createElement("a");
    requestLink.href = "/requests.html";
    requestLink.textContent = "Заявки";
    panel.append(requestLink);
    const profileLink = document.createElement("a");
    profileLink.href = "/profile.html";
    profileLink.textContent = "Профиль";
    panel.append(profileLink);
    const originalAction = controls.querySelector(".header-action");
    if (originalAction) {
      const action = document.createElement(originalAction.tagName === "A" ? "a" : "button");
      action.textContent = "Разместить объект";
      if (originalAction.tagName === "A") action.href = originalAction.href;
      else { action.type = "button"; action.addEventListener("click", () => { menu.open = false; originalAction.click(); }); }
      panel.append(action);
    }
    if (favorite) {
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = "Избранное";
      action.addEventListener("click", () => { favorite.click(); menu.open = false; });
      panel.append(action);
    }
    controls.append(menu);
    menu.addEventListener("keydown", event => {
      if (event.key === "Escape") { menu.open = false; menu.querySelector("summary").focus(); }
    });
    document.addEventListener("click", event => { if (!menu.contains(event.target)) menu.open = false; });
  }
  // Keep language control in the header even if i18n boots after this script.
  const placeLanguages = () => {
    const switcher = document.querySelector(".language-switcher");
    if (switcher && controls) controls.prepend(switcher);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", placeLanguages, { once: true });
  else placeLanguages();
})();

/* Liberterra 20261019: presentation enhancement over the live catalogue. */
(() => {
  function enhance() {
    if (document.body.classList.contains('concept-v20')) return;
    if (!document.body.classList.contains('home-redesign') || document.querySelector('.liberterra-intro-note')) return;
    const hero=document.querySelector('.home-hero-inner'), catalog=document.querySelector('.catalog');
    if(!hero||!catalog)return;
    document.body.classList.add('liberterra-editorial');
    const title=document.getElementById('homeHeroTitle');if(title)title.textContent='Ваш город. Ваш дом. Ваши возможности.';
    const eyebrow=hero.querySelector('.hero-eyebrow');if(eyebrow)eyebrow.textContent='LIBERTERRA · НЕДВИЖИМОСТЬ БИШКЕКА';
    const intro=hero.querySelector(':scope > p');if(intro)intro.textContent='Покупайте, снимайте и продавайте недвижимость. Находите свой дом и специалистов, которым можно задать важные вопросы.';
    const note=document.createElement('div');note.className='liberterra-intro-note';note.innerHTML='<span>Продаёте или сдаёте?</span> <a href="/add-object.html">Разместите объект ↗</a><span class="lt-note-dot">·</span><span>Ищете недвижимость?</span> <a href="/add-request.html">Оставьте заявку ↗</a>';hero.append(note);
    const pulse=document.createElement('div');pulse.className='liberterra-pulse';pulse.innerHTML='<div class="wrap"><span>● ЖИЗНЬ В БИШКЕКЕ</span><a href="/index.html?deal=продажа&propertyType=apartment">Квартиры</a><a href="/index.html?deal=продажа&propertyType=house">Частные дома</a><a href="/index.html?deal=аренда">Аренда</a><a href="/requests.html">Клиенты ищут</a><a href="/object-map.html">Объекты на карте ↗</a></div>';document.querySelector('.home-hero').after(pulse);
    const h=catalog.querySelector('h2');if(h)h.textContent='Место для новой главы';
    const ce=catalog.querySelector('.catalog-eyebrow');if(ce)ce.textContent='КАТАЛОГ НЕДВИЖИМОСТИ';
    // Limit the initial presentation, while retaining every filtered result in the DOM.
    const grid=document.getElementById('catalogGrid');
    if(grid){
      grid.classList.add('lt-preview-grid');
      const more=document.createElement('button');more.type='button';more.className='lt-show-more';more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','catalogGrid');catalog.append(more);
      function sync(){const count=grid.querySelectorAll(':scope > .card').length;more.hidden=count<=6;more.textContent=grid.classList.contains('lt-show-all')?'Показать первые 6':'Смотреть все объекты ('+count+') →';}
      more.addEventListener('click',()=>{const expanded=grid.classList.toggle('lt-show-all');more.setAttribute('aria-expanded',String(expanded));sync();if(!expanded)catalog.scrollIntoView({behavior:'smooth',block:'start'});});
      new MutationObserver(sync).observe(grid,{childList:true});sync();
    }
    const journey=document.createElement('section');journey.className='liberterra-journey';journey.innerHTML='<div class="wrap lt-editorial-section"><span class="lt-kicker">ОДИН ГОРОД. МНОГО ВОЗМОЖНОСТЕЙ.</span><h2>С чего начнётся ваша история?</h2><div class="lt-journey-grid"><a href="/index.html?deal=продажа"><span>01 ↗</span><h3>Найти свой дом</h3><p>Квартиры, дома и коммерческие помещения. Подбирайте по району и бюджету.</p></a><a href="/add-object.html"><span>02 ↗</span><h3>Продать или сдать</h3><p>Добавьте фотографии, цену и условия. Управляйте объектом в своём кабинете.</p></a><a href="/agents.html"><span>03 ↗</span><h3>Найти специалиста</h3><p>Познакомьтесь с агентами Бишкека и выберите, к кому обратиться.</p></a><a href="/newbuildings.html"><span>04 ↗</span><h3>Выбрать новостройку</h3><p>Изучите жилые комплексы и предложения в новых домах.</p></a></div></div>';catalog.after(journey);
    const district=document.createElement('section');district.className='wrap lt-editorial-section lt-city-section';district.innerHTML='<div class="lt-city-visual" role="img" aria-label="Панорама Бишкека и площадь Ала-Тоо"><span>БИШКЕК · ГОРОД, КОТОРЫЙ МЫ ЗНАЕМ</span></div><div><span class="lt-kicker">БЛИЖЕ К ВАШЕЙ ЖИЗНИ</span><h2>Не просто квадратные метры.<br><em>Ваше место в городе.</em></h2><p>Рядом с любимым парком, в центре событий или в тихом районе. Выбирайте место под свой ритм жизни.</p><div class="lt-local-links"><a href="/object-map.html">Поиск на карте ↗</a><a href="/index.html?deal=аренда">Аренда жилья ↗</a><a href="/newbuildings.html">Жилые комплексы ↗</a><a href="/mortgage.html">Рассчитать ипотеку ↗</a></div></div>';journey.after(district);
    const owner=document.createElement('section');owner.className='lt-owner-story';owner.innerHTML='<div class="wrap lt-editorial-section"><div><span class="lt-kicker">ДЛЯ СОБСТВЕННИКОВ И АГЕНТОВ</span><h2>У каждого объекта<br>есть своя история.<br><em>Расскажите вашу.</em></h2><p>Покажите пространство, укажите важные детали и дайте покупателю возможность связаться с вами.</p><a class="lt-wine-action" href="/add-object.html">Разместить объект +</a></div><ol><li><h3>Покажите пространство</h3><p>Добавьте фотографии и характеристики недвижимости.</p></li><li><h3>Расскажите о деталях</h3><p>Укажите расположение, стоимость и условия сделки.</p></li><li><h3>Оставайтесь на связи</h3><p>Следите за своими объявлениями и сообщениями в кабинете.</p></li></ol></div>';district.after(owner);
    const services=document.querySelector('.home-services');
    const faq=document.createElement('section');faq.className='lt-faq-section';faq.id='questions';faq.innerHTML='<div class="wrap lt-editorial-section"><div><span class="lt-kicker">ПОЛЕЗНО ЗНАТЬ</span><h2>Вопросы и ответы</h2><a href="/agents.html">Найти агента ↗</a></div><div><details><summary>Как найти подходящий объект?</summary><p>Выберите покупку или аренду, район, тип недвижимости и бюджет. Дополнительные фильтры помогут уточнить площадь, число комнат и этаж.</p></details><details><summary>Как разместить недвижимость?</summary><p>Нажмите «Разместить объект», войдите в свой аккаунт и заполните форму. Добавьте фотографии, характеристики, цену и контактные данные.</p></details><details><summary>Как сохранить понравившиеся варианты?</summary><p>Нажмите на сердечко в карточке объекта. Вернуться к сохранённым вариантам можно через «Избранное».</p></details><details><summary>Что делать, если подходящего варианта пока нет?</summary><p>Оставьте заявку на покупку или аренду: укажите район, бюджет и пожелания. Ваша заявка поможет специалистам понять, что вы ищете.</p><a href="/add-request.html">Оставить заявку →</a></details></div></div>';
    if(services)services.after(faq);else owner.after(faq);
    const final=document.createElement('section');final.className='wrap lt-editorial-section lt-final-story';final.innerHTML='<span class="lt-kicker">LIBERTERRA</span><h2>Ваш следующий адрес<br>начинается здесь.</h2><a class="lt-wine-action" href="/add-request.html">Помогите мне найти недвижимость →</a>';faq.after(final);
    const footer=document.querySelector('.site-footer');if(footer)footer.classList.add('lt-editorial-footer');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
})();

