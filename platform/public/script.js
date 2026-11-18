if(!window.LiberterraListingFormat){
(() => {
  "use strict";
  const text = value => String(value ?? "").trim();

  // Presentation only. Never infer a different currency, amount or price period.
  function price(value) {
    return text(value).replace(/(^|\s)(сом|USD|KGS)(?:\s+\2)+(?=\s|$)/gi, "$1$2").replace(/\$(\d{4,9})(?![\d.,])/g, (_, digits) => `$${digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`);
  }

  function floor(value) {
    if (/^24\s*\/\s*7\s*этаж$/i.test(text(value))) return "";
    // Only collapse an identical repeated total, e.g. 13/14 этаж/14 этаж.
    return text(value).replace(/^(\d+)\s*\/\s*(\d+)\s*этаж(?:\s*\/\s*\2\s*этаж)+$/i, "$1/$2 этаж");
  }

  function period(value) {
    return text(value)
      .replace(/^(?:\s*\/\s*){2,}/, "/ ")
      .replace(/\/\s*м[²2]\s*\/\s*мес(?:\s*\/\s*мес)+$/i, "/ м²/мес")
      .replace(/\/\s*мес(?:\s*\/\s*мес)+$/i, "/ мес");
  }

  function title(value) {
    const source = text(value);
    if (/^0-комн\.,\s*участок$/i.test(source)) return "Участок";
    if (/^офис\s*:\s*(?:любая|офис)$/i.test(source)) return "Офис";
    const parts = source.split(/\s*[:·|]\s*/).filter(Boolean);
    return parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase() ? parts[0] : source;
  }

  // Website submissions historically stored raw form values in the public
  // catalog. Format only those records; legacy listings keep their wording.
  function websiteFields(row) {
    const original = {
      title: title(row.title),
      area: text(row.area),
      floor: floor(row.floor),
      per: period(row.per),
    };
    if (!/^site-[0-9a-f-]+$/i.test(text(row.id))) return original;

    const rooms = text(row.rooms);
    if (/^\d{1,2}$/.test(rooms) && Number(rooms) > 0 && /^(?:Квартира|Дом|Комната)$/i.test(original.title)) {
      original.title = `${rooms}-комн., ${original.title.toLowerCase()}`;
    }
    if (/^\d+(?:[.,]\d+)?$/.test(original.area)) original.area += " м²";

    const total = text(row.total_floors);
    if (/^\d{1,3}$/.test(original.floor)) {
      original.floor += /^\d{1,3}$/.test(total) ? `/${total} этаж` : " этаж";
    } else if (/^\d{1,3}\s*\/\s*\d{1,3}$/.test(original.floor)) {
      original.floor += " этаж";
    }

    const rent = text(row.deal).toLowerCase() === "аренда";
    if (!original.per && rent) original.per = "/ мес";
    else if (/^\/?\s*м[²2]$/i.test(original.per)) original.per = rent ? "/ м²/мес" : "/ м²";
    return original;
  }

  function priceParts(amount, currency, basis, period) {
    const cleanAmount = text(amount).replace(/\s+/g, "").replace(",", ".");
    if (!/^\d+(?:\.\d{1,2})?$/.test(cleanAmount) || Number(cleanAmount) <= 0) return null;
    if (!["сом", "$"].includes(text(currency))) return null;
    if (!["object", "m2"].includes(text(basis))) return null;
    if (!["none", "month"].includes(text(period))) return null;
    return { amount: cleanAmount, currency: text(currency), basis: text(basis), period: text(period) };
  }

  function hasConflictingCurrency(value) {
    const source = text(value);
    return /\$|\bUSD\b/i.test(source) && /сом|\bKGS\b/i.test(source);
  }

  window.LiberterraListingFormat = Object.freeze({ hasConflictingCurrency, price, period, floor, title, websiteFields, priceParts });
})();

}
if(!window.LiberterraV20 && document.querySelector("#heroCity")){
/* New homepage composition; the existing catalogue controller owns publication filters and access. */
(()=>{
const ru={title:'Купить, продать, снять или сдать',intro:'Недвижимость в Кыргызстане. Смотрите объекты и заявки: найдите жильё или узнайте, что ищут покупатели и арендаторы.',browse:'Найти недвижимость ↗',post:'Разместить объект',request:'Оставить заявку',buy:'Купить',rent:'Арендовать',city:'Город',type:'Тип недвижимости',budget:'Бюджет до',find:'Найти объекты →',extra:'Дополнительные фильтры',district:'Район',keyword:'Поиск по описанию',reset:'Сбросить фильтры',current:'Актуальные объявления',all:'Все объекты →',first:'Первые 3 ↑',supply:'ПРЕДЛОЖЕНИЕ / ОБЪЕКТЫ',selling:'Что продают и сдают',sellingText:'Сравните цену и расположение. Выберите список или карту.',seeObjects:'Смотреть объекты →',demand:'СПРОС / ЗАЯВКИ',looking:'Что хотят купить или снять',lookingText:'Читайте запросы по району и бюджету. Предложите подходящий объект.',seeRequests:'Смотреть заявки →',loading:'Загружаем…',unavailable:'Каталог недоступен',details:'Подробнее ↗'};
const en={title:'Buy, sell, rent or let',intro:'Property in Kyrgyzstan. Explore listings and requests to find a home or see what buyers and tenants need.',browse:'Find property ↗',post:'List a property',request:'Post a request',buy:'Buy',rent:'Rent',city:'City',type:'Property type',budget:'Budget up to',find:'Find properties →',extra:'More filters',district:'District',keyword:'Search description',reset:'Reset filters',current:'Current listings',all:'All properties →',first:'First 3 ↑',supply:'SUPPLY / PROPERTIES',selling:'Properties for sale and rent',sellingText:'Compare price and location. Choose the list or map.',seeObjects:'View properties →',demand:'DEMAND / REQUESTS',looking:'What buyers and tenants need',lookingText:'Explore requests by district and budget. Suggest a suitable property.',seeRequests:'View requests →',loading:'Loading…',unavailable:'Catalogue unavailable',details:'Details ↗'};
const ky={title:'Сатып алуу, сатуу же ижара',intro:'Кыргызстандагы кыймылсыз мүлк. Үй табуу же сатып алуучулар менен ижарачылардын суроо-талаптарын көрүү үчүн жарыяларды караңыз.',browse:'Кыймылсыз мүлк табуу ↗',post:'Объект жарыялоо',request:'Өтүнмө калтыруу',buy:'Сатып алуу',rent:'Ижарага алуу',city:'Шаар',type:'Мүлктүн түрү',budget:'Бюджет чеги',find:'Объекттерди табуу →',extra:'Кошумча чыпкалар',district:'Район',keyword:'Сүрөттөмө боюнча издөө',reset:'Чыпкаларды тазалоо',current:'Актуалдуу жарыялар',all:'Бардык объекттер →',first:'Алгачкы 3 ↑',supply:'СУНУШ / ОБЪЕКТТЕР',selling:'Сатуу жана ижара сунуштары',sellingText:'Баасын жана жайгашкан жерин салыштырыңыз. Тизмени же картаны тандаңыз.',seeObjects:'Объекттерди көрүү →',demand:'СУРОО-ТАЛАП / ӨТҮНМӨЛӨР',looking:'Сатып алуучулар жана ижарачылар эмне издешет',lookingText:'Район жана бюджет боюнча өтүнмөлөрдү окуңуз. Ылайыктуу объект сунуштаңыз.',seeRequests:'Өтүнмөлөрдү көрүү →',loading:'Жүктөлүүдө…',unavailable:'Каталог жеткиликсиз',details:'Кененирээк ↗'};
const zh={title:'购买、出售或租赁房产',intro:'吉尔吉斯斯坦房地产。浏览房源和需求，寻找住所或了解买家与租客的需要。',browse:'寻找房产 ↗',post:'发布房源',request:'发布需求',buy:'购买',rent:'租赁',city:'城市',type:'房产类型',budget:'预算上限',find:'查找房源 →',extra:'更多筛选',district:'地区',keyword:'搜索描述',reset:'重置筛选',current:'当前房源',all:'全部房源 →',first:'前3条 ↑',supply:'供应 / 房源',selling:'出售和出租的房产',sellingText:'比较价格和位置。选择列表或地图。',seeObjects:'查看房源 →',demand:'需求 / 申请',looking:'买家和租客的需求',lookingText:'按地区和预算查看需求，推荐合适的房产。',seeRequests:'查看需求 →',loading:'加载中…',unavailable:'房源目录暂不可用',details:'详情 ↗'};
Object.assign(ru,{retry:"Повторить загрузку",allCities:"Все города"});Object.assign(en,{retry:"Retry loading",allCities:"All cities"});Object.assign(ky,{retry:"Кайра жүктөө",allCities:"Бардык шаарлар"});Object.assign(zh,{retry:"重新加载",allCities:"所有城市"});const dictionaries={ru,en,ky,zh};function text(key){return(dictionaries[window.LiberterraI18n?.language]||ru)[key]||ru[key]||key;}
Object.assign(ru,{title:'Найди своё пространство для комфортной работы и жилья',intro:'Проверенная недвижимость в Кыргызстане: реальные фотографии, актуальные предложения и надёжные специалисты.',proofPhoto:'Реальные фото и цены',proofOffers:'Актуальные предложения',proofAgents:'Надёжные специалисты'});
Object.assign(en,{title:'Find your space for comfortable living and work',intro:'Verified property in Kyrgyzstan with real photos, current listings and trusted specialists.',proofPhoto:'Real photos and prices',proofOffers:'Current listings',proofAgents:'Trusted specialists'});
Object.assign(ky,{title:'Жашоо жана иштөө үчүн ыңгайлуу мейкиндикти табыңыз',intro:'Кыргызстандагы текшерилген кыймылсыз мүлк: чыныгы сүрөттөр, актуалдуу сунуштар жана ишенимдүү адистер.',proofPhoto:'Чыныгы сүрөттөр жана баалар',proofOffers:'Актуалдуу сунуштар',proofAgents:'Ишенимдүү адистер'});
Object.assign(zh,{title:'寻找舒适生活与工作的理想空间',intro:'吉尔吉斯斯坦可靠房产：真实照片、最新房源和可信赖的专业人士。',proofPhoto:'真实照片和价格',proofOffers:'最新房源',proofAgents:'可靠专业人士'});
function titleMarkup(){const lang=window.LiberterraI18n?.language||'ru';const parts={ru:['Найди своё пространство для комфортной','работы и жилья'],en:['Find your space for comfortable','living and work'],ky:['Жашоо жана иштөө үчүн','ыңгайлуу мейкиндикти табыңыз'],zh:['寻找舒适生活与工作的','理想空间']}[lang]||['Найди своё пространство для комфортной','работы и жилья'];return `${parts[0]} <span>${parts[1]}</span>`;}
window.LiberterraV20={text,card(item,index,h){const e=h.escapeHtml;return `<article class="v20-card" data-card-index="${index}" data-list-source="objects" data-object-url="${e(h.objectUrl(item))}" role="link" tabindex="0" aria-label="${e(item.title)}"><div class="v20-photo">${h.cardPhoto(item,index)}</div><div class="v20-card-pad"><div class="v20-price price">${h.priceHtml(item)}</div>${(/м²/.test(String(item.per||''))&&item.priceNumber>0&&item.areaNumber>0)?'<div class="v20-total">'+({ru:'Итого',en:'Total',ky:'Жалпы',zh:'合计'}[window.LiberterraI18n?.language||'ru']||'Итого')+' ≈ '+(item.priceCurrency==='kgs'?'':'$')+Math.round(item.priceNumber*item.areaNumber).toLocaleString('ru-RU')+(item.priceCurrency==='kgs'?' сом':'')+' '+String(item.per).replace('м²/','')+'</div>':''}<div class="v20-tags"><span class="v20-pill">${e(item.dealLabel)}</span>${item.verified?'<span class="v20-verified">✓ '+({ru:'Проверено',en:'Verified',ky:'Текшерилген',zh:'已核验'}[window.LiberterraI18n?.language||'ru']||'Проверено')+'</span>':''}</div><h3>${e(item.title)}</h3><p class="v20-specs">${[item.roomsText,item.area,item.city,item.district].filter(Boolean).map(e).join(' · ')}</p><div class="v20-card-actions"><a class="v20-button" data-v20="details" href="https://liberterra.kg${e(h.objectUrl(item))}">${e(text('details'))}</a><button class="v20-button" type="button" data-favorite-card="${index}" aria-label="Избранное" aria-pressed="${h.isFavorite(item)}">${h.isFavorite(item)?'♥':'♡'}</button></div></div></article>`}};
function update(){document.querySelector("#heroPriceMax")?.setAttribute("aria-label",text("budget"));const allCities=document.querySelector("#heroCity option[value=all]");if(allCities)allCities.textContent=text("allCities");const brand=document.querySelector(".brand");if(brand&&!brand.querySelector('.brand-logo'))brand.innerHTML='<img class="brand-logo" src="/assets/liberterra-logo-adapted.png" alt="Liberterra">';const heroTitle=document.querySelector('#homeHeroTitle');document.querySelectorAll('[data-v20]').forEach(e=>{e.setAttribute('translate','no');if(e!==heroTitle)e.textContent=text(e.dataset.v20)});if(heroTitle)heroTitle.innerHTML=titleMarkup();const more=document.querySelector('#v20All');if(more&&!document.body.classList.contains('v20-catalog'))more.textContent=text(document.querySelector('#catalogGrid').classList.contains('expanded')?'first':'all');}
document.addEventListener('DOMContentLoaded',()=>{const grid=document.querySelector('#catalogGrid'),more=document.querySelector('#v20All');grid?.classList.add('expanded');if(more){more.hidden=true;more.setAttribute('aria-expanded','true')}const controls=document.querySelector('.header-controls');const theme=document.createElement('button');theme.className='v20-theme';theme.type='button';theme.textContent='◐';theme.setAttribute('aria-label','Сменить тему');theme.addEventListener('click',()=>{const dark=document.body.dataset.v20Theme?document.body.dataset.v20Theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;document.body.dataset.v20Theme=dark?'light':'dark'});controls?.prepend(theme);update();});window.addEventListener('liberterra:languagechange',update);
})();

/* Public catalogue comparison. Only selected IDs are stored in this tab. */
(()=>{'use strict';
const words={
ru:{compare:'Сравнить',chosen:'В сравнении',title:'Сравнение объектов',hint:'Выберите 2–3 объекта. Сравнение хранится только в этой вкладке.',close:'Закрыть',clear:'Очистить',remove:'Убрать',limit:'Можно сравнить до 3 объектов. Уберите один, чтобы добавить другой.',price:'Цена',deal:'Сделка',place:'Адрес / район',rooms:'Комнаты',area:'Площадь',floor:'Этаж',open:'Открыть объект',missing:'Не указано',note:'Цены указаны в валюте объявления. Покупка и аренда имеют разные условия; уточните их в карточке.',count:'Выбрано',map:'На карте',owner:'Разместить объект',menu:'Меню',skip:'Перейти к содержимому'},
en:{compare:'Compare',chosen:'Selected',title:'Compare properties',hint:'Choose 2–3 properties. Your comparison is kept in this tab only.',close:'Close',clear:'Clear',remove:'Remove',limit:'Compare up to 3 properties. Remove one to add another.',price:'Listing price',deal:'Transaction',place:'Location',rooms:'Rooms',area:'Area',floor:'Floor',open:'View property',missing:'Not provided',note:'Prices use the listing currency. Sale and rental terms differ; check each property for details.',count:'Selected',map:'View map',owner:'List a property',menu:'Menu',skip:'Skip to content'},
ky:{compare:'Салыштыруу',chosen:'Тандалды',title:'Объекттерди салыштыруу',hint:'2–3 объект тандаңыз. Салыштыруу ушул өтмөктө гана сакталат.',close:'Жабуу',clear:'Тазалоо',remove:'Алып салуу',limit:'3 объектке чейин салыштыра аласыз. Жаңысын кошуу үчүн бирин алып салыңыз.',price:'Жарыядагы баа',deal:'Бүтүм',place:'Жайгашкан жер',rooms:'Бөлмөлөр',area:'Аянты',floor:'Кабат',open:'Объектти ачуу',missing:'Көрсөтүлгөн эмес',note:'Баалар жарыянын валютасында. Сатуу жана ижара шарттарын объекттин барагынан тактаңыз.',count:'Тандалды',map:'Картадан көрүү',owner:'Объект жарыялоо',menu:'Меню',skip:'Мазмунга өтүү'},
zh:{compare:'比较',chosen:'已选择',title:'房源比较',hint:'选择2–3个房源。比较仅保存在此标签页中。',close:'关闭',clear:'清空',remove:'移除',limit:'最多比较3个房源。请先移除一个。',price:'挂牌价格',deal:'交易类型',place:'位置',rooms:'房间',area:'面积',floor:'楼层',open:'查看房源',missing:'未提供',note:'价格使用挂牌货币。买卖和租赁条件不同，请查看房源详情。',count:'已选择',map:'地图',owner:'发布房源',menu:'菜单',skip:'跳转到内容'}
};
const t=k=>(words[window.LiberterraI18n?.language]||words.ru)[k];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='liberterra-compare-ids-v1';let ids=[];try{const saved=JSON.parse(sessionStorage.getItem(key)||'[]');if(Array.isArray(saved))ids=[...new Set(saved.filter(x=>typeof x==='string'))].slice(0,3);}catch(_){}
let catalog=new Map(),bar,dialog,returnFocus;
function persist(){try{sessionStorage.setItem(key,JSON.stringify(ids));}catch(_){}}
function price(item){return window.LiberterraListingFormat?.hasConflictingCurrency(item.price)?({en:'Price to be confirmed',ky:'Баасы такталат',zh:'价格待确认'}[window.LiberterraI18n?.language]||'Цена уточняется'):item.price;}
function renderDialog(){
 const items=ids.map(id=>catalog.get(id)).filter(Boolean);
 dialog.dataset.compareColumns=String(items.length);
 const rows=[['price',x=>[price(x),x.per].filter(Boolean).join(' ')],['deal',x=>x.dealLabel],['place',x=>[x.city,x.district].filter(Boolean).join(', ')],['rooms',x=>x.roomsText],['area',x=>x.area],['floor',x=>x.floor]];
 dialog.innerHTML=`<div class="compare-heading"><h2 id="compareTitle">${t('title')}</h2><button type="button" data-compare-close autofocus>${t('close')}</button></div><p>${t('note')}</p><div class="compare-scroll" tabindex="0" role="region" aria-label="${t('title')}"><table><caption class="sr-only">${t('title')}</caption><thead><tr><th scope="col">${t('title')}</th>${items.map(x=>`<th scope="col"><a href="/object.html?id=${encodeURIComponent(x.id)}">${esc(x.title)}</a><button type="button" data-compare-remove="${esc(x.id)}" aria-label="${t('remove')}: ${esc(x.title)}">${t('remove')}</button></th>`).join('')}</tr></thead><tbody>${rows.map(([label,value])=>`<tr><th scope="row">${t(label)}</th>${items.map(x=>`<td>${esc(value(x)||t('missing'))}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">${t('open')}</th>${items.map(x=>`<td><a href="/object.html?id=${encodeURIComponent(x.id)}">${t('open')}</a></td>`).join('')}</tr></tbody></table></div>`;
}
function update(){
 if(!bar)return;
 bar.hidden=ids.length===0;document.body.classList.toggle('has-comparison',ids.length>0);
 bar.querySelector('[data-compare-count]').textContent=`${t('count')}: ${ids.length} / 3`;
 const open=bar.querySelector('[data-compare-open]');open.textContent=t('compare');open.disabled=ids.length<2;
 bar.querySelector('[data-compare-clear]').textContent=t('clear');
 document.querySelectorAll('[data-compare-id]').forEach(button=>{const selected=ids.includes(button.dataset.compareId);button.setAttribute('aria-pressed',String(selected));button.textContent=t(selected?'chosen':'compare');button.setAttribute('aria-label',`${t(selected?'chosen':'compare')}: ${catalog.get(button.dataset.compareId)?.title||''}`);});
 document.querySelector('[data-compare-hint]')?.replaceChildren(document.createTextNode(t('hint')));
 if(dialog.open)renderDialog();
}
window.LiberterraCompare={has:id=>ids.includes(String(id)),label:()=>t('compare'),setCatalog(items){catalog=new Map(items.filter(x=>x.id&&!x.isRequest).map(x=>[String(x.id),x]));ids=ids.filter(id=>catalog.has(id));persist();requestAnimationFrame(update);}};
document.addEventListener('DOMContentLoaded',()=>{
 if(!document.querySelector('#catalogGrid'))return;
 const head=document.querySelector('.v20-section-head');
 const actions=document.createElement('div');actions.className='catalog-actions';actions.innerHTML=`<a class="v20-button" href="/object-map.html" data-award-map>${t('map')}</a><a class="v20-button" href="/add-object.html" data-award-owner>${t('owner')}</a>`;head?.append(actions);
 
 bar=document.createElement('aside');bar.className='compare-bar';bar.hidden=true;bar.setAttribute('aria-label',t('title'));bar.innerHTML=`<span data-compare-count role="status"></span><span data-compare-message class="sr-only" role="status"></span><button type="button" data-compare-open></button><button type="button" data-compare-clear></button>`;document.body.append(bar);
 dialog=document.createElement('dialog');dialog.className='compare-dialog';dialog.setAttribute('aria-labelledby','compareTitle');document.body.append(dialog);
 dialog.addEventListener('close',()=>{returnFocus?.isConnected&&returnFocus.focus();});
 document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-compare-id')){event.preventDefault();const id=button.dataset.compareId;if(!catalog.has(id))return;if(ids.includes(id))ids=ids.filter(x=>x!==id);else if(ids.length<3)ids.push(id);else {bar.querySelector('[data-compare-message]').classList.remove('sr-only');bar.querySelector('[data-compare-message]').textContent=t('limit');return;}bar.querySelector('[data-compare-message]').textContent='';persist();update();}
  if(button.hasAttribute('data-compare-open')){returnFocus=button;renderDialog();dialog.showModal();}
  if(button.hasAttribute('data-compare-close'))dialog.close();
  if(button.hasAttribute('data-compare-clear')){ids=[];persist();update();document.querySelector('[data-compare-id]')?.focus();}
  if(button.hasAttribute('data-compare-remove')){ids=ids.filter(x=>x!==button.dataset.compareRemove);persist();if(ids.length<2)dialog.close();update();if(dialog.open)dialog.querySelector('[data-compare-close]')?.focus();}
 });
 update();
});
window.addEventListener('liberterra:languagechange',()=>{update();document.querySelector('[data-award-map]')?.replaceChildren(document.createTextNode(t('map')));document.querySelector('[data-award-owner]')?.replaceChildren(document.createTextNode(t('owner')));});
})();



}
/* Stable geography independent of currently available listings. */
globalThis.LiberterraGeo = (() => {
 const regions = [
  ['kg-chuy','Кыргызстан','Чуйская область',['Бишкек','Токмок','Кант','Кара-Балта','Шопоков','Орловка','Кемин']],
  ['kg-issyk','Кыргызстан','Иссык-Кульская область',['Каракол','Чолпон-Ата','Балыкчы']],
  ['kg-naryn','Кыргызстан','Нарынская область',['Нарын','Кочкор','Ат-Башы']],
  ['kg-jalal','Кыргызстан','Джалал-Абадская область',['Джалал-Абад','Кара-Куль','Таш-Кумыр','Майлуу-Суу','Кербен','Кочкор-Ата']],
  ['kg-osh','Кыргызстан','Ошская область',['Ош','Узген','Кара-Суу']],
  ['kg-talas','Кыргызстан','Таласская область',['Талас']],
  ['kg-batken','Кыргызстан','Баткенская область',['Баткен','Кызыл-Кия','Сулюкта','Раззаков']],
  ['kz','Казахстан','Казахстан',['Алматы','Астана','Шымкент','Караганда']],
  ['ru','Россия','Россия',['Москва','Санкт-Петербург','Екатеринбург','Казань','Новосибирск','Сочи']],
  ['uz','Узбекистан','Узбекистан',['Ташкент','Самарканд','Бухара']],
  ['tj','Таджикистан','Таджикистан',['Душанбе','Худжанд']],
  ['ae','ОАЭ','ОАЭ',['Дубай','Абу-Даби']],
  ['tr','Турция','Турция',['Стамбул','Анталья']],
  ['us','США','США',['Нью-Йорк','Майами']],
  ['az','Азербайджан','Азербайджан',['Баку']],
  ['cz','Чехия','Чехия',['Прага']],
  ['ua','Украина','Украина',['Киев']]
 ];
 const norm=value=>String(value||'').trim().toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[–—]/g,'-').replace(/\s+/g,' ');
 const aliases={'питер':'санкт-петербург','санкт петербург':'санкт-петербург','спб':'санкт-петербург','алма-ата':'алматы','нур-султан':'астана','жалал-абад':'джалал-абад','bishkek':'бишкек','moscow':'москва','tashkent':'ташкент','almaty':'алматы','astana':'астана','yekaterinburg':'екатеринбург'};
 const city=value=>aliases[norm(value)]||norm(value);
 const countries={kg:'Кыргызстан',kz:'Казахстан',ru:'Россия',uz:'Узбекистан',tj:'Таджикистан',ae:'ОАЭ',tr:'Турция',us:'США',az:'Азербайджан',cz:'Чехия',ua:'Украина'};
 const countryAliases={kyrgyzstan:'kg',кыргызстан:'kg',киргизия:'kg',kgz:'kg',kazakhstan:'kz',kaz:'kz',russia:'ru',rus:'ru',uzbekistan:'uz',uzb:'uz'};
 const countryCode=value=>Object.keys(countries).find(k=>k===norm(value)||norm(countries[k])===norm(value))||countryAliases[norm(value)]||'';
 const regionOf=item=>regions.find(r=>r[0]===item.region||norm(r[2])===norm(item.region)||r[3].some(c=>city(c)===city(item.city)));
 function matches(item,selection){
  if(!selection||selection==='all')return true;
  const region=regionOf(item);
  if(selection.startsWith('country:'))return (countryCode(item.country)||(region?region[0].split('-')[0]:''))===selection.slice(8);
  if(selection.startsWith('region:'))return region?.[0]===selection.slice(7);
  return city(item.city)===city(selection);
 }
 function populate(select,items,selected){
  if(!select)return;
  const option=(value,label)=>new Option(label,value);
  const all=option('all',globalThis.LiberterraV20?.text('allCities')||'Все города');
  const countryGroup=document.createElement('optgroup');countryGroup.label='Страны';
  Object.entries(countries).forEach(([code,name])=>countryGroup.append(option('country:'+code,name+' — все города')));
  const groups=regions.map(r=>{const group=document.createElement('optgroup');group.label=r[1]===r[2]?r[1]:r[1]+' · '+r[2];if(r[0].startsWith('kg-'))group.append(option('region:'+r[0],r[2]+' — все города'));r[3].forEach(c=>group.append(option(c,c)));return group;});
  const known=new Set(regions.flatMap(r=>r[3].map(city)));
  const extra=[...new Set(items.map(i=>i.city).filter(c=>c&&!known.has(city(c))))];
  if(selected&&selected!=='all'&&!selected.includes(':')&&!known.has(city(selected))&&!extra.includes(selected))extra.push(selected);
  if(extra.length){const group=document.createElement('optgroup');group.label='Другие города';extra.sort().forEach(c=>group.append(option(c,c)));groups.push(group);}
  const kgAll=[...countryGroup.children].find(o=>o.value==='country:kg');if(kgAll)countryGroup.label='Другие страны';const kgGroups=groups.filter((g,i)=>regions[i]&&regions[i][0].startsWith('kg-')),otherGroups=groups.filter(g=>!kgGroups.includes(g));select.replaceChildren(all,...(kgAll?[kgAll]:[]),...kgGroups,countryGroup,...otherGroups);
  const canonical=regions.flatMap(r=>r[3]).find(c=>city(c)===city(selected));
  select.value=canonical||selected||'all';if(!select.value)select.value='all';
 }
 return {regions,countries,matches,populate};
})();

// Preserve query-based entry links when the legacy root route serves HTML.
if (location.pathname === '/' && location.search && !document.querySelector('.v20-main')) {
  location.replace('/index.html' + location.search + location.hash);
}
const SHEET_CSV_URL = "/api/public-catalog";
const RENT_CONTACT_URL = "https://wa.me/996500804402";
const SALE_CONTACT_URL = "https://wa.me/996500804402";
// Keep the hero image on the same origin as the page. This works identically
// on the Worker and the Pages mirror and avoids cross-origin/cache failures.
const HERO_IMAGE = "/assets/hero-building.webp";
const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";
const PHOTO_FALLBACK_ORIGIN = window.location.origin;
const FAVORITES_KEY = "liberterra_favorite_objects_v1";
let remoteFavoriteIds = new Set();
let favoritesSyncStarted = false;

document.documentElement.dataset.catalogScriptStartedMs = String(Math.round(performance.now()));

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.photoFallbackDone === "true") return;
  const source = image.currentSrc || image.src;
  if (!source.startsWith(`${PHOTO_DELIVERY_ORIGIN}/uploads/`)) return;
  image.dataset.photoFallbackDone = "true";
  image.src = source.replace(`${PHOTO_DELIVERY_ORIGIN}/uploads/`, `${PHOTO_FALLBACK_ORIGIN}/uploads/`);
}, true);
const SPECIALISTS = [
  {
    id: "kairat",
    name: "Ражапов Кайрат",
    role: "Специалист по аренде недвижимости",
    phone: "+996505804402",
    displayPhone: "0505 804 402",
    photo: "assets/kairat-razhapov-v2.png",
    reviews: [
      "Быстро подобрал варианты под бюджет и район.",
      "Сразу объяснил условия аренды и помог связаться по объекту.",
      "Ведет общение спокойно, понятно и по делу.",
    ],
  },
  {
    id: "nurzlan",
    name: "Исмаилов Нурзлан",
    role: "Специалист по аренде недвижимости",
    phone: "+996505804402",
    displayPhone: "0505 804 402",
    photo: "assets/nurzlan-ismailov-v2.png",
    reviews: [
      "Оперативно уточнил детали и организовал просмотр.",
      "Помог разобраться с условиями аренды и контактами.",
      "Хорошо ориентируется по коммерческим объектам и площади.",
    ],
  },
];

const state = {
  catalogStatus: "loading",
  deals: ["аренда"],
  rentTerm: "monthly",
  segment: "all",
  propertyType: "all",
  occupancy: "all",
  rooms: "all",
  district: "all",
  city: "all",
  priceCurrency: "usd",
  query: "",
  priceMin: "",
  priceMax: "",
  areaMin: "",
  areaMax: "",
  floorMin: "",
  floorMax: "",
  requestDeal: "all",
  objects: [],
  requests: [],
  favoritesOnly: false,
  source: [],
  sourceStaff: [],
};

const CATALOG_FILTERS_KEY = "liberterra_catalog_filters_v1";
const CATALOG_FILTER_KEYS = [
  "city", "rentTerm", "segment", "propertyType", "occupancy", "rooms", "district",
  "priceCurrency", "query", "priceMin", "priceMax", "areaMin", "areaMax", "floorMin",
  "floorMax", "requestDeal",
];

const DEALS = ["продажа", "аренда"];
const dealSelected = name => state.deals.includes(name);
const dealMatches = item => state.deals.includes(normalize(item?.deal).toLowerCase());
const digitsOnly = value => normalize(value).replace(/\D+/g, "");
const SOURCE_GROUPS = ["mine", "agency", "other"];
const SOURCE_LABELS = { mine: "Мои", agency: "Моей организации", other: "Других организаций" };
const VIEWER_SESSION_KEY = "liberterra-verified-web-user";
const AGENT_ACCOUNT_TYPES = ["agent", "Агент", "admin", "Администратор"];
let viewer = null;
let viewerRequested = false;

function restoreCatalogFilters() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(CATALOG_FILTERS_KEY) || "{}"); } catch { saved = {}; }
  const params = new URLSearchParams(window.location.search);
  const preferredCurrency = localStorage.getItem('v20-public-currency');
  if (['USD','KGS'].includes(preferredCurrency)) state.priceCurrency = preferredCurrency.toLowerCase();
  CATALOG_FILTER_KEYS.forEach((key) => {
    const value = params.has(key) ? params.get(key) : saved[key];
    if (value !== null && value !== undefined && value !== "") state[key] = String(value);
  });
  const savedDeals = Array.isArray(saved.deals) ? saved.deals.join(",") : saved.deals ?? saved.deal;
  const dealValue = params.has("deal") ? params.get("deal") : savedDeals;
  const deals = String(dealValue || "").split(",").map(part => part.trim().toLowerCase()).filter(part => DEALS.includes(part));
  if (deals.length) state.deals = [DEALS.find(deal => deals.includes(deal))];
  const savedSource = Array.isArray(saved.source) ? saved.source.join(",") : saved.source;
  const sourceValue = params.has("source") ? params.get("source") : savedSource;
  state.source = String(sourceValue || "").split(",").map((part) => part.trim()).filter((part) => SOURCE_GROUPS.includes(part));
  const savedStaff = Array.isArray(saved.sourceStaff) ? saved.sourceStaff.join(",") : saved.sourceStaff;
  const staffValue = params.has("staff") ? params.get("staff") : savedStaff;
  state.sourceStaff = String(staffValue || "").split(",")
    .map((part) => normalizeSearch(part)).filter((part) => part && part !== "all");
  const favoriteValue = params.has("favoritesOnly") ? params.get("favoritesOnly") : saved.favoritesOnly;
  state.favoritesOnly = favoriteValue === true || favoriteValue === "1" || favoriteValue === "true";
  if (!state.deals.length) state.deals = ["аренда"];
  if (!dealSelected("аренда")) state.occupancy = "all";
  if (!['usd','kgs'].includes(state.priceCurrency)) state.priceCurrency = 'usd';
}

function catalogFilterParams() {
  const params = new URLSearchParams();
  CATALOG_FILTER_KEYS.forEach((key) => params.set(key, String(state[key] ?? "")));
  params.set("deal", state.deals.join(","));
  if (state.source.length) params.set("source", state.source.join(","));
  if (state.sourceStaff.length) params.set("staff", state.sourceStaff.join(","));
  if (state.favoritesOnly) params.set("favoritesOnly", "1");
  return params;
}

function persistCatalogFilters() {
  const params = catalogFilterParams();
  try { localStorage.setItem(CATALOG_FILTERS_KEY, JSON.stringify({ ...state, objects: undefined, requests: undefined })); } catch (_) {}
  const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
  document.querySelectorAll('a[href*="object-map.html"]').forEach((link) => {
    link.href = `/object-map.html?${params.toString()}`;
  });
}

restoreCatalogFilters();
persistCatalogFilters();

function favoriteIds() {
  let local = [];
  try { local = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]").map(String); } catch { local = []; }
  return new Set([...local, ...remoteFavoriteIds]);
}

function isFavorite(item) { return Boolean(item?.id && favoriteIds().has(String(item.id))); }

function toggleFavorite(item) {
  if (!item?.id) return;
  const ids = favoriteIds();
  const id = String(item.id);
  if (ids.has(id)) ids.delete(id); else ids.add(id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
  if (ids.has(id)) remoteFavoriteIds.add(id); else remoteFavoriteIds.delete(id);
  window.LiberterraAgentAccess?.request("set_user_favorite", { object_id: id, enabled: ids.has(id) }).catch(() => {});
  render();
}

async function syncAccountFavorites() {
  const hasUserSession = window.LiberterraAgentAccess?.hasUserSession;
  if (favoritesSyncStarted || typeof hasUserSession !== "function" || !hasUserSession()) return;
  favoritesSyncStarted = true;
  try {
    const profile = await window.LiberterraAgentAccess.request("get_user_profile", {});
    remoteFavoriteIds = new Set((profile.favorite_object_ids || []).map(String));
    let localIds = [];
    try { localIds = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]").map(String); } catch { localIds = []; }
    const unsyncedIds = localIds.filter((id) => !remoteFavoriteIds.has(id));
    if (unsyncedIds.length) {
      await window.LiberterraAgentAccess.request("set_user_favorites", { object_ids: unsyncedIds });
      unsyncedIds.forEach((id) => remoteFavoriteIds.add(id));
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...remoteFavoriteIds]));
    render();
  } catch (_) {
    favoritesSyncStarted = false;
  }
}

function applyViewerProfile(profile) {
  const user = profile?.user || {};
  const isAgent = AGENT_ACCOUNT_TYPES.includes(normalize(user.account_type));
  const name = normalizeSearch(user.name);
  const agency = normalizeSearch(user.agency);
  const phone = digitsOnly(user.phone).slice(-9);
  viewer = isAgent && (name || agency || phone) ? { name, agency, phone } : null;
  if (viewer) loadAgencyRegistry();
  if (!viewer && (state.source.length || state.sourceStaff.length)) {
    state.source = [];
    state.sourceStaff = [];
  }
  render();
}

function hasWebSessionHint() {
  try {
    const raw = localStorage.getItem(VIEWER_SESSION_KEY) || sessionStorage.getItem(VIEWER_SESSION_KEY);
    const cached = JSON.parse(raw || "null");
    return Boolean(cached?.verified_at && Date.now() - Number(cached.verified_at) < 24 * 60 * 60 * 1000);
  } catch (_) { return false; }
}

// The source filter needs the signed-in agent. Guests make no extra request.
async function resolveViewer() {
  if (viewerRequested) return;
  const telegramSession = window.LiberterraAgentAccess?.hasUserSession?.() === true;
  if (!telegramSession && !hasWebSessionHint()) return;
  viewerRequested = true;
  try {
    if (telegramSession) {
      applyViewerProfile(await window.LiberterraAgentAccess.request("get_user_profile", {}));
      return;
    }
    const response = await fetch("/api/user-access", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "web_profile" }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.ok) applyViewerProfile(body);
  } catch (_) {
    viewerRequested = false;
  }
}

// Реестр агентов: имя → агентство. Нужен, пока фид не отдаёт агентство строкой.
let agencyByAgent = new Map();
let agentDirectory = new Map();
let agencyRegistryRequested = false;
async function loadAgencyRegistry() {
  if (agencyRegistryRequested) return;
  agencyRegistryRequested = true;
  try {
    const response = await fetch("/api/public-agents", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok || !body?.ok || !Array.isArray(body.agents)) throw Error("agents_unavailable");
    agencyByAgent = new Map(body.agents
      .filter(agent => normalize(agent?.name) && normalize(agent?.agency))
      .map(agent => [normalizeSearch(agent.name), normalize(agent.agency)]));
    agentDirectory = new Map(body.agents
      .filter(agent => normalize(agent?.name))
      .map(agent => [normalizeSearch(agent.name), {
        name: normalize(agent.name),
        agency: normalize(agent.agency),
        avatar: normalize(agent.avatar_url),
      }]));
    render();
  } catch (_) {
    agencyRegistryRequested = false;
  }
}

function agentAgencyOf(item) {
  return normalize(item?.listingAgentAgency) || agencyByAgent.get(normalizeSearch(item?.sourceAgentName)) || "";
}

function sourceGroupOf(item) {
  if (!viewer) return "other";
  const phone = digitsOnly(item.listingAgentPhone);
  const name = normalizeSearch(item.sourceAgentName);
  if (viewer.phone && phone && phone.endsWith(viewer.phone)) return "mine";
  if (viewer.name && name && name === viewer.name) return "mine";
  const agency = normalizeSearch(agentAgencyOf(item));
  if (viewer.agency && agency && agency === viewer.agency) return "agency";
  return "other";
}

// Выбранные группы и сотрудники складываются: объект подходит, если попал хотя бы в одну отметку.
function sourceMatches(item) {
  if (!viewer) return true;
  if (!state.source.length && !state.sourceStaff.length) return true;
  // «Моей организации» — вся компания, включая собственные объявления агента.
  const groups = new Set(state.source);
  if (groups.has("agency")) groups.add("mine");
  if (groups.has(sourceGroupOf(item))) return true;
  return state.sourceStaff.includes(normalizeSearch(item.sourceAgentName));
}

function sourceFilterActive() {
  return Boolean(viewer) && (state.source.length > 0 || state.sourceStaff.length > 0);
}

// Имена выбранных сотрудников: сначала реестр, затем то, что встретилось в выдаче.
function sourceStaffNames() {
  const byKey = new Map();
  agentDirectory.forEach((agent, key) => { if (agent.name) byKey.set(key, agent.name); });
  state.objects.forEach((item) => {
    const key = normalizeSearch(item.sourceAgentName);
    if (key && !byKey.has(key)) byKey.set(key, normalize(item.sourceAgentName));
  });
  return state.sourceStaff.map((key) => byKey.get(key) || "выбранный сотрудник");
}

function sourceFilterSummary() {
  return [...state.source.map((group) => SOURCE_LABELS[group]), ...sourceStaffNames()].join(", ");
}

const grid = document.querySelector("#catalogGrid");
const requestGrid = document.querySelector("#requestGrid");
const resultCount = document.querySelector("#resultCount");
const requestCount = document.querySelector("#requestCount");
const trustLine = document.querySelector("#trustLine");
const filterGroups = document.querySelectorAll(".filter-group");
const catalogSearch = document.querySelector("#catalogSearch");
const districtFilter = document.querySelector("#districtFilter");
const heroDistrictFilter = document.querySelector("#heroDistrictFilter");
const heroDistrictOptions = document.querySelector("#heroDistrictOptions");
const heroPropertyType = document.querySelector("#heroPropertyType");
const heroShowButton = document.querySelector("#heroShowButton");
const heroShowCount = document.querySelector("#heroShowCount");
const heroPriceMin = document.querySelector("#heroPriceMin");
const heroPriceMax = document.querySelector("#heroPriceMax");
const priceCurrency = document.querySelector("#priceCurrency");
const resetFilters = document.querySelector("#resetFilters");
const favoritesFilter = document.querySelector("#favoritesFilter");
const toggleCatalogFilters = document.querySelector("#toggleCatalogFilters");
const catalogFilterOptions = document.querySelector("#catalogFilterOptions");
const rentTermGroup = document.querySelector("#rentTermGroup");
const filterInputs = {
  priceMin: document.querySelector("#priceMin"),
  priceMax: document.querySelector("#priceMax"),
  areaMin: document.querySelector("#areaMin"),
  areaMax: document.querySelector("#areaMax"),
  floorMin: document.querySelector("#floorMin"),
  floorMax: document.querySelector("#floorMax"),
};
const objectModal = document.querySelector("#objectModal");
const modalContent = document.querySelector("#modalContent");
const specialistGrid = document.querySelector("#specialistGrid");
const DISTRICT_OPTIONS = [
  "69-га", "Азия Молл", "Ак Кеме", "Ак-Орго ж/м", "Ак-Ордо 3 ж/м", "Ак-Ордо ж/м", "Академия Наук", "Ала-Тоо 3 ж-м", "Ала-Тоо м-н", "Арча-Бешик ж/м", "Баха", "БГУ", "Верхний Джал м-н", "Гагарина", "Госрегистр", "Джал 15 м-н", "Джал-23 м-н (Нижний Джал)", "Джал-29 м-н", "Джал-30 м-н", "Джальская больница", "ж/м Ала-Арча 2", "Завод Кока-Кола", "Ипподром", "Калыка Акиева - Льва Толстого", "Киргизия 1 ж/м", "Киргизия-2 м-н", "Кызыл-Аскер ж/м", "Лущихина - Льва Толстого", "Молодая Гвардия", "Московская - Белинка", "Московская - Уметалиева", "Орок ж/м", "Ошский рынок", "Пишпек ж/м", "Рабочий Городок", "с. Верхний Орок", "с. Джал", "с. Калтар", "с. Кашка-Баш", "с. Нижний Орок", "с. Новопавловка", "с. Орто-Сай", "с. Сарбан", "с. Селекционное", "с. Чон-Арык", "Сейил, жилой комплекс", "СК. Тоо-Жели", "Средний Джал м-н", "Старый аэропорт", "Тенир-Тоо м-н", "Филармония", "Шлагбаум", "Ынтымак ж/м", "10 м-н", "11 м-н", "12 м-н", "3 м-н", "4 м-н", "5 м-н", "6 м-н", "7 м-н", "8 м-н", "9 м-н", "Айкол (с. Кок-Джар)", "Ала-Арча 3", "Ала-Арча ж/м", "Алматинка - Магистраль", "Алтын-Ордо ж/м", "Анар-Бак ж/м", "Асанбай м-н", "АУЦА", "Ахунбаева-Достоевского", "АЮ Grand", "Восточная Промзона", "Ген прокуратура", "Горького - Алма-Атинская", "Жилгородок Совмина ж/м", "Кара Дарыя", "Кара-Жыгач ж/м", "Карла Маркса", "КГУСТА", "Кок-Жар ж/м", "Кок-Жар м-н", "Кулатова- Матросова", "Магистраль", "Матросова", "Мед. академия", "Ортосайский рынок", "Оскон-Ордо ж/м", "Парк Ататюрк", "Полицейский городок м-н", "Проспект Айтматова", "Рухий Мурас ж/м", "с. Кок-Джар", "Советская - Скрябина", "Таш Рабат", "Токольдош ж/м", "Тунгуч 44", "Тунгуч м-н", "Улан м-н", "Улан-2 м-н", "Учкун-2 ж/м", "Физкультурный", "Чокана Валиханова - Исакеева", "1000 мелочей", "110 квартал ж/м", "VEFA", "Ак Эмир рынок", "Ак-Босого ж/м", "Алтын-Бешик ж/м", "Алтын-Казык ж/м", "Аска-Таш ж/м", "Ата Журт", "Балбан-Таймаш ж/м", "Бишкек-Парк", "Боталиева - Тулебердиева", "Вечерка", "Военторг", "Горького - Панфилова", "Дворец спорта", "Ден Сяопина - Фучика", "Достук", "Достук м-н", "Душанбинка", "ж/м Учкун-2 (Аэропорт)", "ЖД вокзал", "Западный автовокзал", "Золотой квадрат", "Калыс-Ордо 2", "Калыс-Ордо ж/м", "Касым ж/м", "Керемет ж/м", "КНУ", "Колмо ж/м", "Космос", "Кудайберген", "Маданият ж/м", "Манаса-Кудрука", "Махатма Ганди - БЧК", "Моссовет", "Мурас-Ордо ж/м", "Парк Панфилова/Спартак", "Площадь Победы", "Политех", "с. Дача СУ", "с. Достук", "с. Кернивоз", "с. Лесное", "с. Маевка", "с. Озёрное", "с. Пригородное", "с. Степное", "с. Учкун", "Салам-Алик ж/м", "Сквер Тоголок Молдо", "Тендик ж/м", "Тоголок Молдо - Щербакова", "Тоголок-Молдо - БЧК", "Тынчтык м-н", "Умут ж/м", "Хабитат ж/м", "Щербакова ж/м", "Юг-2 м-н", "Айкол (с. Лебединовка)", "Ак-Бата ж/м", "Ак-Жар ж/м", "Ак-Тилек 2 ж/м", "Ак-Тилек ж/м", "Академия МВД", "Аламедин-1 м-н", "Аламединский рынок", "Бакай-Ата ж/м", "Восток-5 м-н", "Восточный автовокзал", "Гоин", "Городок строителей", "Городок энергетиков", "Дзержинского - Куренкеева", "Дордой 2 ж/м", "Дордой ж/м", "Дордой Плаза", "ж/м Биримдик Кут", "Жибек-Жолу - Лермонтова", "Кайынды ж/м", "Карагачевая роща", "Карпинка", "Келечек ж/м", "Керамическая ж/м", "Керченский ж/м", "Кожзавод", "Комфорт", "Красный Строитель 2 ж/м", "Красный Строитель ж/м", "Кузнечная крепость", "Лебединовка", "Мадина", "Нижний Токольдош", "Орозбекова - Жибек-Жолу", "с. Аламудун", "с. Восток", "с. Мыкан", "с. Нижняя Ала-Арча", "с. Садовое", "Советская - БЧК", "Советская - Куренкеева", "Советская - Щербакова", "Станционный", "Старый толчок", "Таатан", "Табачка", "Тоголок молдо- Куренкеева", "Туберкулезная больница", "ТЭЦ", "Учкун ж/м", "Учкун м-н", "Центральная мечеть", "Церковь", "Цирк/Дворец бракосочетания", "ЦУМ", "Чалбай ж/м", "Чуй - Алматинка", "Элебесова - Фере (Турбаза)", "Эне-Сай ж/м", "Юбилейка",
];
window.LIBERTERRA_DISTRICTS = DISTRICT_OPTIONS;

document.documentElement.style.setProperty("--hero-image", `url("${HERO_IMAGE}")`);

const pinSvg = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 2.25c-3.92 0-7.1 3.07-7.1 6.86 0 5.15 7.1 12.64 7.1 12.64s7.1-7.49 7.1-12.64c0-3.79-3.18-6.86-7.1-6.86Zm0 9.6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
  </svg>
`;

function normalize(value) {
  return String(value || "").trim();
}

function normalizeSearch(value) {
  return normalize(value)
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[.,;:()]/g, " ")
    .replace(/\s+/g, " ");
}

function numberFromText(value) {
  const match = normalize(value).replace(/\s+/g, "").match(/\d+(?:[.,]\d+)?/);
  return match ? Number.parseFloat(match[0].replace(",", ".")) : null;
}

function currencyFromPrice(value) {
  const text = normalize(value).toLowerCase();
  if (text.includes("$") || text.includes("usd") || text.includes("дол")) return "usd";
  if (text.includes("сом") || text.includes("kgs") || text.includes("кгс")) return "kgs";
  return "";
}

function withinRange(value, min, max) {
  const from = numberFromText(min);
  const to = numberFromText(max);
  if (from === null && to === null) return true;
  if (value === null) return true;
  if (from !== null && value < from) return false;
  if (to !== null && value > to) return false;
  return true;
}

function districtMatches(itemDistrict) {
  if (state.district === "all") return true;
  const selected = normalizeSearch(state.district);
  const district = normalizeSearch(itemDistrict);
  return district === selected || district.startsWith(`${selected} `) || district.includes(selected);
}

function priceMatches(item) {
  const hasPriceFilter = numberFromText(state.priceMin) !== null || numberFromText(state.priceMax) !== null;
  if (hasPriceFilter && (window.LiberterraListingFormat.hasConflictingCurrency(item.price) || !Number.isFinite(item.priceNumber) || !item.priceCurrency || item.priceCurrency !== state.priceCurrency)) return false;
  return withinRange(item.priceNumber, state.priceMin, state.priceMax);
}

function isVerified(value) {
  return ["true", "1", "yes", "да", "истина"].includes(normalize(value).toLowerCase());
}

function escapeHtml(value) {
  return normalize(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pluralObject(count) {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return "объект";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "объекта";
  return "объектов";
}

function pluralRequest(count) {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return "заявка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "заявки";
  return "заявок";
}

function roomText(row) {
  const rooms = Number.parseInt(normalize(row.rooms), 10);
  if (!Number.isFinite(rooms) || rooms <= 0) return "";
  if (rooms === 1) return "1 комната";
  if (rooms >= 2 && rooms <= 4) return `${rooms} комнаты`;
  return `${rooms} комнат`;
}

function contactMessage(item) {
  const specs = [item.area, item.floor].filter(Boolean).join(", ");
  return [
    "Здравствуйте! Пишу по объекту с сайта Liberterra:",
    item.title,
    `Район: ${item.district}`,
    `Цена: ${item.price}${displayPer(item) ? ` ${displayPer(item)}` : ""}`,
    specs ? `Характеристики: ${specs}` : "",
  ].filter(Boolean).join("\n");
}

function isSaleDeal(item) {
  return normalize(item?.deal).toLowerCase() === "продажа";
}

function displayPer(item) {
  return isSaleDeal(item) ? "" : normalize(item?.per);
}

function priceHtml(item) {
  if (window.LiberterraListingFormat.hasConflictingCurrency(item.price)) return `<span class="price-unconfirmed">Цена уточняется</span>`;
  const per = displayPer(item);
  return `<span class="price-with-conversion" data-fx-price="${escapeHtml(item.price)}" data-fx-per="${escapeHtml(per)}">${escapeHtml(item.price)}${per ? ` <small>${escapeHtml(per)}</small>` : ""}</span>`;
}

function contactLink(item) {
  if (item.isRequest && item.contactLink) {
    return item.contactLink;
  }
  if (item.phone) {
    const digits = phoneDigits(item.phone);
    if (digits) return `https://wa.me/${digits}?text=${encodeURIComponent(contactMessage(item))}`;
  }
  const baseUrl = isSaleDeal(item) ? SALE_CONTACT_URL : RENT_CONTACT_URL;
  return `${baseUrl}?text=${encodeURIComponent(contactMessage(item))}`;
}

function callLink(item) {
  const phone = item.phone || (item.isRequest ? item.contactPhone : "");
  if (phone) {
    const digits = phoneDigits(phone);
    if (digits) return `tel:+${digits}`;
  }
  return isSaleDeal(item) ? "tel:+996500804402" : "tel:+996500804402";
}

function displayPhone(item) {
  const phone = item?.phone || (item?.isRequest ? item.contactPhone : "");
  if (phone) {
    return formatPhone(phone);
  }
  return isSaleDeal(item) ? "0500 804 402" : "0500 804 402";
}

function phoneDigits(phone) {
  const digits = normalize(phone).replace(/\D/g, "");
  if (digits.startsWith("996")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return `996${digits.slice(1)}`;
  if (digits.length === 9) return `996${digits}`;
  return digits;
}

function formatPhone(phone) {
  const digits = phoneDigits(phone);
  if (digits.length === 12 && digits.startsWith("996")) {
    return `+996 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return normalize(phone);
}

function contactGateHtml(item) {
  if (!item?.id) return '<span class="contact-gate-note">Контакт уточняется</span>';
  const id = escapeHtml(item.id);
  return `<span class="contact-gate-actions" data-contact-gate-wrap="${id}"><button class="card-action primary" type="button" data-contact-gate="${id}">Открыть номер</button></span>`;
}

function phoneFromWhatsappLink(link) {
  const match = normalize(link).match(/wa\.me\/(\d+)/i);
  return match ? match[1] : "";
}

function specialistMessage(specialist) {
  const firstName = normalize(specialist.name).split(/\s+/)[1] || normalize(specialist.name);
  return `Здравствуйте, ${firstName}! Пишу с сайта Liberterra. Хочу проконсультироваться по аренде недвижимости в Бишкеке.`;
}

function specialistWhatsAppLink(specialist) {
  return `https://wa.me/${phoneDigits(specialist.phone)}?text=${encodeURIComponent(specialistMessage(specialist))}`;
}

function specialistCallLink(specialist) {
  return `tel:+${phoneDigits(specialist.phone)}`;
}

function starsHtml() {
  return `<span class="stars" aria-label="Рейтинг 5 из 5">★★★★★</span>`;
}

function photoUrls(value) {
  return normalize(value)
    .split(/\s*(?:\||\n)\s*/)
    .map((url) => url.trim())
    .map((url) => url.replace(
      /^https:\/\/liberterra-kg-catalog\.pages\.dev\/uploads\//i,
      `${PHOTO_DELIVERY_ORIGIN}/uploads/`,
    ))
    .filter(Boolean)
    .slice(0, 5);
}

function rowIsRequest(row) {
  const deal = normalize(row.deal).toLowerCase();
  const segment = normalize(row.segment).toLowerCase();
  const title = normalize(row.title).toLowerCase();
  return deal === "запрос"
    || segment === "запрос"
    || title.includes("ищет")
    || title.includes("ищу")
    || title.includes("сниму")
    || title.includes("арендую")
    || title.includes("куплю")
    || title.includes("заявк");
}

function detectRequestDeal(row) {
  const text = normalizeSearch([
    row.request_deal,
    row.request_type,
    row.description,
    row.title,
    row.deal,
  ].filter(Boolean).join(" "));
  if (text.includes("покуп") || text.includes("купит") || text.includes("куплю")) return "buy";
  return "rent";
}

function requestActionLabel(value, segment) {
  if (value === "buy") return "Куплю";
  return normalize(segment).toLowerCase() === "коммерция" ? "Арендую" : "Сниму";
}

function requestTitleLabel(row, requestDeal, segment) {
  const title = normalize(row.title);
  const action = requestActionLabel(requestDeal, segment);
  if (!title) return action;
  return title.replace(/^(?:ищет|ищу|купит|покупка)(?=\s|$)/i, action);
}

function requestCardClass(item) {
  if (!item.isRequest) return "";
  return item.requestDeal === "buy" ? " request-card-buy" : " request-card-rent";
}

function detectPropertyType(row) {
  const segment = normalize(row.segment).toLowerCase();
  const title = normalizeSearch(row.title);
  if (segment === "коммерция") return "commercial";
  if (title.includes("участ") || title.includes("земл")) return "land";
  if (title.includes("дом") || title.includes("коттедж") || title.includes("таунхаус")) return "house";
  if (title.includes("кварт") || title.includes("студ")) return "apartment";
  return "all";
}

function typeMatches(item) {
  if (state.propertyType === "all") return true;
  if (state.propertyType === "commercial") {
    return item.segment === "Коммерция" || item.propertyType === "commercial";
  }
  if (item.segment === "Коммерция") return false;
  if (item.propertyType === "all") return true;
  return item.propertyType === state.propertyType;
}

function rentTermMatches(item) {
  if (normalize(item?.deal).toLowerCase() !== "аренда") return true;
  const period = normalize(item?.per).toLowerCase();
  const isDaily = /сут|посуточ|день|daily|day/.test(period);
  return state.rentTerm === "daily" ? isDaily : !isDaily;
}

function idFromLink(link) {
  const match = normalize(link).match(/object_([^&\s]+)/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function normalizeRow(row) {
  const websiteFields = window.LiberterraListingFormat.websiteFields(row);
  const segment = normalize(row.segment);
  const deal = normalize(row.deal);
  const tgLink = normalize(row.tg_link);
  const isRequest = rowIsRequest(row);
  const requestDeal = isRequest ? detectRequestDeal(row) : "";
  return {
    id: normalize(row.id) || idFromLink(tgLink),
    status: normalize(row.status),
    tgLink,
    contactLink: tgLink,
    contactPhone: phoneFromWhatsappLink(tgLink),
    // Contact data is intentionally not kept in the visitor-visible catalogue.
    phone: "",
    contactName: normalize(row.contact_name || row.owner_name || row.telegram_full_name || row.telegram_username),
    posterType: normalize(row.poster_type),
    listingAgentName: normalize(row.listing_agent_name),
    listingAgentAgency: normalize(row.listing_agent_agency),
    listingAgentPublicRef: normalize(row.listing_agent_public_ref),
    listingAgentPhone: digitsOnly(row.listing_agent_phone),
    // Фид пока не отдаёт имя и агентство агента: для объявлений, размещённых
    // агентом, его имя лежит в contact_name, агентство берётся из реестра.
    sourceAgentName: normalize(row.listing_agent_name)
      || (digitsOnly(row.listing_agent_phone) || normalize(row.contact_privacy_mode).startsWith("agent")
        ? normalize(row.contact_name) : ""),
    isRequest,
    requestDeal,
    segment,
    city: normalize(row.city) || "Бишкек",
    region: normalize(row.region || row.oblast),
    country: normalize(row.country),
    deal,
    dealLabel: isRequest ? requestActionLabel(requestDeal, segment) : deal,
    propertyType: detectPropertyType(row),
    rooms: normalize(row.rooms),
    roomsText: roomText(row),
    price: window.LiberterraListingFormat.price(row.price) || "Цена по запросу",
    priceNumber: numberFromText(row.price),
    priceCurrency: currencyFromPrice(row.price),
    per: websiteFields.per,
    title: isRequest
      ? requestTitleLabel(row, requestDeal, segment)
      : websiteFields.title || "Объект недвижимости",
    area: websiteFields.area,
    areaNumber: numberFromText(row.area),
    floor: websiteFields.floor,
    floorNumber: numberFromText(row.floor),
    district: normalize(row.district) || "Район уточняется",
    verified: isVerified(row.verified),
    photoUrls: photoUrls(row.photo_url),
    description: normalize(row.description || row.extra || row["Описание"] || row["описание"] || row.wishes || row.comment || row.notes),
    year: normalize(row.year),
    documents: normalize(row.documents),
    condition: normalize(row.condition),
    landArea: normalize(row.land_area),
    occupancyType: normalize(row.occupancy_type),
    preferredTenant: normalize(row.preferred_tenant),
    currentResidents: normalize(row.current_residents),
    moveInDate: normalize(row.move_in_date),
    utilitiesIncluded: normalize(row.utilities_included),
    deposit: normalize(row.deposit),
    submittedDate: normalize(row.created_at || row.published_at || row.updated_at || row.date || row["Дата"] || row.created || row.timestamp),
    isShared: Boolean(normalize(row.occupancy_type) && normalize(row.occupancy_type) !== "Весь объект"),
  };
}

function requestDateLanguage() {
  return window.LiberterraI18n?.language || "ru";
}

function requestCalendarDay(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bishkek",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = Number(part.value);
    return result;
  }, {});
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

function requestAgeText(value) {
  const submittedDay = requestCalendarDay(value);
  const today = requestCalendarDay(new Date().toISOString());
  if (submittedDay === null || today === null) return "";
  const days = Math.max(0, Math.round((today - submittedDay) / 86400000));
  const language = requestDateLanguage();
  if (language === "ky") return days === 0 ? "бүгүн" : `${days} күн мурун`;
  if (language === "en") return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
  if (language === "zh") return days === 0 ? "今天" : days === 1 ? "1天前" : `${days}天前`;
  if (days === 0) return "сегодня";
  if (days === 1) return "1 день назад";
  const mod10 = days % 10;
  const mod100 = days % 100;
  const unit = mod10 === 1 && mod100 !== 11 ? "день" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "дня" : "дней";
  return `${days} ${unit} назад`;
}

function requestSubmittedHtml(item) {
  if (!item.isRequest) return "";
  const language = requestDateLanguage();
  if (!item.submittedDate) {
    const missing = language === "ky" ? "Келген күнү көрсөтүлгөн эмес" : language === "en" ? "Submitted date unavailable" : language === "zh" ? "未注明提交日期" : "Дата поступления не указана";
    return `<div class="request-submitted is-missing">${escapeHtml(missing)}</div>`;
  }
  const parsed = new Date(item.submittedDate);
  if (Number.isNaN(parsed.getTime())) return "";
  const locale = language === "ky" ? "ky-KG" : language === "en" ? "en-GB" : language === "zh" ? "zh-CN" : "ru-RU";
  const label = language === "ky" ? "Келген күнү" : language === "en" ? "Submitted" : language === "zh" ? "提交于" : "Поступила";
  const exact = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Bishkek",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
  return `<div class="request-submitted"><span aria-hidden="true">◷</span> ${escapeHtml(label)}: ${escapeHtml(exact)} · ${escapeHtml(requestAgeText(item.submittedDate))}</div>`;
}

function objectUrl(item) {
  if (!item?.id) return "";
  const currentLaunch = `${window.location.search}${window.location.hash}`;
  if (/[?&#]tgWebApp(?:Data|Version|Platform)=/i.test(currentLaunch)) {
    sessionStorage.setItem("liberterra_telegram_launch", currentLaunch);
  }
  const telegramLaunch = /[?&#]tgWebApp(?:Data|Version|Platform)=/i.test(currentLaunch)
    ? currentLaunch
    : sessionStorage.getItem("liberterra_telegram_launch") || "";
  const suffix = /[?&#]tgWebApp(?:Version|Platform)=/i.test(telegramLaunch)
    ? `${telegramLaunch.startsWith("?") ? `&${telegramLaunch.slice(1)}` : telegramLaunch}`
    : "";
  return `/object.html?id=${encodeURIComponent(item.id)}${suffix}`;
}

function publicObjectUrl(item) {
  // Never share Telegram launch/session parameters with another visitor.
  return item?.id ? new URL(`/object.html?id=${encodeURIComponent(item.id)}`, window.location.origin).href : "";
}

function attributionData(item) {
  if (!item || item.isRequest) return { publisher: "", ownership: "" };
  const posterType = normalize(item.posterType).toLowerCase();
  const isAgentListing = Boolean(item.listingAgentName) || posterType === "агент";
  const publisher = normalize(item.listingAgentName || item.contactName);
  let ownership = "";
  if (isAgentListing) {
    ownership = item.listingAgentAgency
      ? `Агентское · Компания ${item.listingAgentAgency}`
      : "Агентское объявление";
  } else if (posterType === "собственник") {
    ownership = "Объявление собственника";
  } else if (item.posterType) {
    ownership = `Объявление: ${item.posterType}`;
  }
  return { publisher, ownership };
}

function attributionHtml(item) {
  const { publisher, ownership } = attributionData(item);
  if (!publisher && !ownership) return "";
  const publisherHtml = publisher && item.listingAgentPublicRef
    ? `<a href="/agent-public.html?agent=${encodeURIComponent(item.listingAgentPublicRef)}">${escapeHtml(publisher)}</a>`
    : publisher ? `<strong>${escapeHtml(publisher)}</strong>` : "";
  return `
    <div class="card-attribution" aria-label="Автор и принадлежность объявления">
      ${publisher ? `<div class="card-attribution-row"><span>Добавил объект</span>${publisherHtml}</div>` : ""}
      ${ownership ? `<div class="card-attribution-row"><span>Чьё объявление</span><strong>${escapeHtml(ownership)}</strong></div>` : ""}
    </div>
  `;
}

function shareText(item) {
  const botObjectLink = item?.id
    ? `https://t.me/Liberterra_kg_bot?start=object_${encodeURIComponent(item.id)}`
    : "https://t.me/Liberterra_kg_bot";
  const { publisher, ownership } = attributionData(item);
  return [
    publisher ? `Добавил объект: ${publisher}` : "",
    ownership ? `Чьё объявление: ${ownership}` : "",
    `Посмотрите объект на Liberterra: ${item.title}`,
    publicObjectUrl(item),
    `Написать по объекту в Telegram-бот: ${botObjectLink}`,
    "Подпишитесь на нашу группу недвижимости: https://t.me/NedvizhimostKGZ",
  ].filter(Boolean).join("\n\n");
}

async function copyObjectLink(item, button) {
  const url = publicObjectUrl(item);
  if (!url || button.disabled) return;
  button.disabled = true;

  try {
    await navigator.clipboard.writeText(url);
    const originalLabel = button.textContent;
    button.textContent = "Ссылка скопирована ✓";
    button.classList.add("is-copied");
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove("is-copied");
    }, 1800);
  } catch {
    let field = button.parentElement.querySelector("[data-copy-link-fallback]");
    if (!field) {
      field = document.createElement("input");
      field.type = "text";
      field.readOnly = true;
      field.dataset.copyLinkFallback = "true";
      field.setAttribute("aria-label", "Ссылка на объект — выделите и скопируйте");
      field.style.cssText = "grid-column:1/-1;width:100%;min-width:0;box-sizing:border-box;padding:12px;font-size:16px";
      field.addEventListener("click", event => { event.stopPropagation(); field.select(); });
      button.parentElement.append(field);
    }
    field.value = url;
    field.focus();
    field.select();
  } finally {
    button.disabled = false;
  }
}

function objectKey(item) {
  return [
    item.segment,
    item.city,
    item.deal,
    item.rooms,
    item.price,
    item.per,
    item.title,
    item.area,
    item.floor,
    item.district,
  ].map((value) => normalize(value).toLowerCase()).join("|");
}

function uniqueObjects(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = objectKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function latestObjectVersions(items) {
  const byKey = new Map();
  items.forEach((item) => {
    const identity = item.id || item.tgLink || objectKey(item);
    const key = `${item.isRequest ? "request" : "object"}:${identity}`;
    byKey.set(key, item);
  });
  return Array.from(byKey.values());
}

function sourceRowKind(row) {
  return rowIsRequest(row) ? "request" : "object";
}

function sourceRowKey(row) {
  const id = normalize(row.id) || idFromLink(row.tg_link);
  return id ? `${sourceRowKind(row)}:${id}` : "";
}

function enrichRowsWithLocalData(rows) {
  const localRows = Array.isArray(window.LIBERTERRA_LOCAL_OBJECTS) ? window.LIBERTERRA_LOCAL_OBJECTS : [];
  if (!localRows.length) return rows;

  const localByKey = new Map();
  localRows.forEach((row) => {
    const key = sourceRowKey(row);
    if (key) localByKey.set(key, row);
  });

  const remoteKeys = new Set();
  const mergedRows = rows.map((row) => {
    const key = sourceRowKey(row);
    if (key) remoteKeys.add(key);
    const fallback = key ? localByKey.get(key) : null;
    if (!fallback) return row;

    const merged = { ...row };
    Object.entries(fallback).forEach(([key, value]) => {
      if (!normalize(merged[key]) && normalize(value)) merged[key] = value;
    });
    return merged;
  });

  localRows.forEach((localRow) => {
    const key = sourceRowKey(localRow);
    if (key && !remoteKeys.has(key)) mergedRows.push(localRow);
  });

  return mergedRows;
}

function showLoading() {
  state.catalogStatus = "loading";
  updateFilterUi();
  if (resultCount) resultCount.textContent = "Загружаем объекты...";
  if (requestCount) requestCount.textContent = "Загружаем заявки...";
  if (trustLine) trustLine.textContent = "Загружаем проверенные объекты в Бишкеке";
  if (grid) grid.innerHTML = Array.from({ length: 3 }, () => `<div class="skeleton" aria-hidden="true"></div>`).join("");
  if (requestGrid) requestGrid.innerHTML = "";
}

function showError(message) {
  state.catalogStatus = "error";
  updateFilterUi();
  if (resultCount) resultCount.textContent = "Ошибка загрузки";
  if (requestCount) requestCount.textContent = "Ошибка загрузки";
  if (trustLine) trustLine.textContent = "Каталог временно недоступен";
  const errorHtml = `
    <div class="state">
      <div>
        <strong>Не удалось загрузить объекты</strong>
        <span>${escapeHtml(message)}</span><button type="button" class="v20-button" data-catalog-retry>${escapeHtml(window.LiberterraV20.text("retry"))}</button>
      </div>
    </div>
  `;
  if (grid) grid.innerHTML = errorHtml;
  if (requestGrid) requestGrid.innerHTML = errorHtml;
}

// Collections use only the already-loaded, publication-filtered catalogue.
const QUICK_COLLECTIONS = [
  { id: "one", label: "1-комнатные", propertyType: "apartment", rooms: "1" },
  { id: "two", label: "2-комнатные", propertyType: "apartment", rooms: "2" },
  { id: "houses", label: "Дома", propertyType: "house", rooms: "all" },
  { id: "commercial", label: "Коммерция", propertyType: "commercial", rooms: "all" },
];

function collectionFilters(collection) {
  return {
    segment: collection.propertyType === "commercial" ? "Коммерция" : "Жильё",
    propertyType: collection.propertyType, rooms: collection.rooms,
    occupancy: "all", district: "all", query: "", priceMin: "", priceMax: "",
    areaMin: "", areaMax: "", floorMin: "", floorMax: "", favoritesOnly: false,
  };
}

function collectionMatches(item, collection) {
  return dealMatches(item)
    && rentTermMatches(item)
    && item.segment === collectionFilters(collection).segment
    && item.propertyType === collection.propertyType
    && (collection.rooms === "all" || Number.parseInt(item.rooms, 10) === Number(collection.rooms));
}

function updateQuickCollections() {
  const container = document.querySelector("#quickCollections");
  if (!container) return;
  let available = 0;
  QUICK_COLLECTIONS.forEach((collection) => {
    const button = container.querySelector(`[data-collection="${collection.id}"]`);
    if (!button) return;
    const count = state.objects.filter((item) => collectionMatches(item, collection)).length;
    button.hidden = count === 0;
    if (count) available++;
    const countNode = button.querySelector("span");
    if (countNode) countNode.textContent = String(count);
    const active = state.quickCollection === collection.id
      && Object.entries(collectionFilters(collection)).every(([key, value]) => state[key] === value);
    button.setAttribute("aria-pressed", String(active));
  });
  container.hidden = available === 0;
}

function filteredObjects() {
  const query = normalizeSearch(state.query);
  const collection = QUICK_COLLECTIONS.find((item) => item.id === state.quickCollection
    && Object.entries(collectionFilters(item)).every(([key, value]) => state[key] === value));
  return state.objects.filter((item) => {
    if(!globalThis.LiberterraGeo.matches(item,state.city))return false;
    if (collection && !collectionMatches(item, collection)) return false;
    if (state.favoritesOnly && !isFavorite(item)) return false;
    if (!dealMatches(item)) return false;

    const bySegment =
      state.segment === "all"
      || item.segment === state.segment;
    if (!bySegment) return false;
    if (!typeMatches(item)) return false;
    if (!rentTermMatches(item)) return false;
    if (state.occupancy === "sharing" && !item.isShared) return false;

    if (!districtMatches(item.district)) return false;

    const rooms = Number.parseInt(item.rooms, 10);
    if (state.rooms !== "all") {
      if (!Number.isFinite(rooms)) return true;
      if (state.rooms === "4+") {
        if (rooms < 4) return false;
      } else if (rooms !== Number.parseInt(state.rooms, 10)) {
        return false;
      }
    }

    if (!sourceMatches(item)) return false;
    if (!priceMatches(item)) return false;
    if (!withinRange(item.areaNumber, state.areaMin, state.areaMax)) return false;
    if (!withinRange(item.floorNumber, state.floorMin, state.floorMax)) return false;

    if (!query) return true;
    const haystack = normalizeSearch([
      item.title,
      item.district,
      item.description,
      item.occupancyType,
    ].filter(Boolean).join(" "));
    return haystack.includes(query);
  });
}

function hasActiveFilters() {
  return state.city !== "all" || state.favoritesOnly
    || sourceFilterActive()
    || state.rentTerm !== "monthly"
    || state.segment !== "all"
    || state.propertyType !== "all"
    || state.occupancy !== "all"
    || state.rooms !== "all"
    || state.district !== "all"
    || Boolean(normalize(state.query))
    || Boolean(normalize(state.priceMin))
    || Boolean(normalize(state.priceMax))
    || Boolean(normalize(state.areaMin))
    || Boolean(normalize(state.areaMax))
    || Boolean(normalize(state.floorMin))
    || Boolean(normalize(state.floorMax));
}

function requestObjects() {
  const intent=document.getElementById('requestIntent')?.value || state.requestDeal;
  const district=normalizeSearch(document.getElementById('requestZone')?.value || '');
  const type=document.getElementById('requestType')?.value || 'all';
  return sortRequestsNewestFirst(state.requests.filter(item=>(intent==='all'||item.requestDeal===intent)&&(!district||normalizeSearch(item.district).includes(district))&&(type==='all'||item.propertyType===type)));
}

function requestSubmittedTimestamp(value) {
  const raw = normalize(value);
  if (!raw) return Number.NEGATIVE_INFINITY;

  const direct = Date.parse(raw);
  if (Number.isFinite(direct)) return direct;

  const yearFirst = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(raw);
  if (yearFirst) {
    return Date.UTC(
      Number(yearFirst[1]),
      Number(yearFirst[2]) - 1,
      Number(yearFirst[3]),
      Number(yearFirst[4] || 0),
      Number(yearFirst[5] || 0),
      Number(yearFirst[6] || 0),
    );
  }

  const dayFirst = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(raw);
  if (dayFirst) {
    return Date.UTC(
      Number(dayFirst[3]),
      Number(dayFirst[2]) - 1,
      Number(dayFirst[1]),
      Number(dayFirst[4] || 0),
      Number(dayFirst[5] || 0),
      Number(dayFirst[6] || 0),
    );
  }

  return Number.NEGATIVE_INFINITY;
}

function sortRequestsNewestFirst(items) {
  return [...items].sort((left, right) => {
    const leftTimestamp = requestSubmittedTimestamp(left.submittedDate);
    const rightTimestamp = requestSubmittedTimestamp(right.submittedDate);
    if (leftTimestamp !== rightTimestamp) {
      if (!Number.isFinite(leftTimestamp)) return 1;
      if (!Number.isFinite(rightTimestamp)) return -1;
      return rightTimestamp - leftTimestamp;
    }

    const leftId = numberFromText(left.id);
    const rightId = numberFromText(right.id);
    if (leftId !== rightId) return rightId - leftId;
    return normalize(right.id).localeCompare(normalize(left.id), "ru", { numeric: true });
  });
}

function visibleList(source) {
  return source === "requests" ? requestObjects() : filteredObjects();
}

function cardPhoto(item, cardIndex) {
  if (item.isRequest) {
    const action = requestActionLabel(item.requestDeal, item.segment);
    return `
      <div class="request-cover ${item.requestDeal === "buy" ? "request-cover-buy" : "request-cover-rent"}" role="img" aria-label="Заявка: ${action}">
        <span>${action.toUpperCase()}</span>
        <em>${action}</em>
        <strong>${escapeHtml(item.segment)}</strong>
        <small>${escapeHtml(item.district)}</small>
      </div>
    `;
  }

  if (item.photoUrls.length) {
    const buttons = item.photoUrls
      .map((url, index) => `
        <button
          class="carousel-dot${index === 0 ? " is-active" : ""}"
          type="button"
          aria-label="Показать фото ${index + 1}"
          data-carousel-card="${cardIndex}"
          data-photo-index="${index}"
        ></button>
      `)
      .join("");

    return `
      <img src="${escapeHtml(item.photoUrls[0])}" alt="${escapeHtml(item.title)}" loading="${cardIndex < 4 ? "eager" : "lazy"}" decoding="async" fetchpriority="${cardIndex < 4 ? "high" : "low"}" data-carousel-image="${cardIndex}">
      ${item.photoUrls.length > 1 ? `
        <button class="carousel-arrow prev" type="button" aria-label="Предыдущее фото" data-carousel-card="${cardIndex}" data-carousel-step="-1">‹</button>
        <button class="carousel-arrow next" type="button" aria-label="Следующее фото" data-carousel-card="${cardIndex}" data-carousel-step="1">›</button>
        <div class="carousel-dots" aria-label="Фото объекта">${buttons}</div>
      ` : ""}
    `;
  }

  return `
    <div class="photo-placeholder" role="img" aria-label="Фото объекта скоро появится">
      <div class="placeholder-pin">${pinSvg}</div>
    </div>
  `;
}

function cardHtml(item, cardIndex, source = "objects") {
  if(document.body.classList.contains("v20-rebuild") && source==="objects")return window.LiberterraV20.card(item,cardIndex,{escapeHtml,objectUrl,cardPhoto,priceHtml,isFavorite});
  const saleSpecs = isSaleDeal(item) ? [item.year && `${item.year} г.`, item.documents, item.condition, item.landArea].filter(Boolean) : [];
  const specs = [item.isShared && item.occupancyType, item.roomsText, item.area, item.floor, ...saleSpecs].filter(Boolean);
  const url = objectUrl(item);
  return `
    <article class="card${item.isRequest ? ` request-card${requestCardClass(item)}` : ""}" data-card-index="${cardIndex}" data-list-source="${escapeHtml(source)}"${url ? ` data-object-url="${escapeHtml(url)}"` : ""} role="link" tabindex="0" aria-label="${item.isRequest ? "Открыть заявку" : "Открыть страницу объекта"}: ${escapeHtml(item.title)}">
      <div class="photo">
        ${cardPhoto(item, cardIndex)}
        ${!item.isRequest && item.id ? `<button class="favorite-button${isFavorite(item) ? " is-active" : ""}" type="button" data-favorite-card="${cardIndex}" aria-label="${isFavorite(item) ? "Удалить из избранного" : "Добавить в избранное"}" aria-pressed="${isFavorite(item)}">${isFavorite(item) ? "♥" : "♡"}</button>` : ""}
        <div class="badge-row">
          ${item.isShared ? `<span class="badge">Подселение</span>` : ""}
          ${window.LiberterraAgentAccess?.contractVerifiedBadgeHtml(item) || ""}
          <span class="deal-tag${item.isRequest ? ` request-tag ${item.requestDeal === "buy" ? "request-tag-buy" : "request-tag-rent"}` : ""}">${escapeHtml(item.dealLabel)}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="price">${priceHtml(item)}</div>
        ${window.LiberterraAgentAccess?.commissionBadgeHtml(item, "card") || ""}
        <p class="title">${escapeHtml(item.title)}</p>
        <div class="district">${pinSvg}<span>${escapeHtml(item.district)}</span></div>
        ${requestSubmittedHtml(item)}
        <div class="specs">
          ${specs.map((spec) => `<span class="spec">${escapeHtml(spec)}</span>`).join("")}
        </div>
        ${attributionHtml(item)}
      </div>
    </article>
  `;
}

function detailPhotoHtml(item) {
  if (!item.photoUrls.length) {
    return `
      <div class="modal-photo">
        <div class="photo-placeholder" role="img" aria-label="Фото объекта скоро появится">
          <div class="placeholder-pin">${pinSvg}</div>
        </div>
      </div>
    `;
  }

  const thumbnails = item.photoUrls.map((url, index) => `
    <img src="${escapeHtml(url)}" alt="${escapeHtml(item.title)} — фото ${index + 1}" loading="lazy">
  `).join("");

  return `
    <div class="modal-photo">
      <img class="modal-main-photo" src="${escapeHtml(item.photoUrls[0])}" alt="${escapeHtml(item.title)}" loading="lazy">
      ${item.photoUrls.length > 1 ? `<div class="modal-thumbs">${thumbnails}</div>` : ""}
    </div>
  `;
}

function detailRow(label, value) {
  if (!normalize(value)) return "";
  return `
    <div class="detail-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function modalHtml(item) {
  return `
    <div class="modal-layout">
      ${detailPhotoHtml(item)}
      <div class="modal-info">
        <div class="modal-tags">
          ${window.LiberterraAgentAccess?.contractVerifiedBadgeHtml(item) || ""}
          <span class="deal-tag${item.isRequest ? ` request-tag ${item.requestDeal === "buy" ? "request-tag-buy" : "request-tag-rent"}` : ""}">${escapeHtml(item.dealLabel)}</span>
          <span class="segment-tag">${escapeHtml(item.segment)}</span>
        </div>
        <h2 id="modalTitle">${escapeHtml(item.title)}</h2>
        <div class="modal-price">${priceHtml(item)}</div>
        ${window.LiberterraAgentAccess?.commissionBadgeHtml(item, "modal") || ""}
        <div class="modal-location">${pinSvg}<span>${escapeHtml(item.district)}</span></div>
        ${requestSubmittedHtml(item)}
        ${attributionHtml(item)}
        ${item.description ? `
          <section class="object-description" aria-label="Описание">
            <h2>Описание</h2>
            <p>${escapeHtml(item.description)}</p>
          </section>
        ` : ""}
        <div class="detail-list">
          ${detailRow("Город", item.city)}
          ${detailRow("Тип", item.segment)}
          ${detailRow("Комнаты", item.roomsText)}
          ${detailRow("Площадь", item.area)}
          ${detailRow("Этаж", item.floor)}
          ${detailRow("Район", item.district)}
          ${detailRow("Формат проживания", item.occupancyType)}
          ${detailRow("Кого рассматривают", item.preferredTenant)}
          ${detailRow("Уже проживает", item.currentResidents ? `${item.currentResidents} чел.` : "")}
          ${detailRow("Заселение", item.moveInDate)}
          ${detailRow("Коммунальные", item.utilitiesIncluded)}
          ${detailRow("Депозит", item.deposit)}
          ${isSaleDeal(item) ? detailRow("Год постройки", item.year) : ""}
          ${isSaleDeal(item) ? detailRow("Документы", item.documents) : ""}
          ${isSaleDeal(item) ? detailRow("Состояние", item.condition) : ""}
          ${isSaleDeal(item) ? detailRow("Площадь участка", item.landArea) : ""}
          ${item.id ? `<div class="detail-row"><span>Контакт</span><strong data-contact-phone="${escapeHtml(item.id)}"><button class="card-action secondary" type="button" data-contact-gate="${escapeHtml(item.id)}">Открыть номер</button></strong></div>` : ""}
        </div>
        <div class="modal-actions">
          ${contactGateHtml(item)}
        </div>
      </div>
    </div>
  `;
}

function openDetails(cardIndex, source = "objects") {
  const item = visibleList(source)[Number(cardIndex)];
  if (!item || !objectModal || !modalContent) return;

  modalContent.innerHTML = modalHtml(item);
  objectModal.hidden = false;
  document.body.classList.add("modal-open");
  objectModal.querySelector(".modal-close")?.focus();
}

function closeDetails() {
  if (!objectModal || !modalContent) return;

  objectModal.hidden = true;
  document.body.classList.remove("modal-open");
  modalContent.innerHTML = "";
}

function openObjectPage(cardIndex, source = "objects") {
  const item = visibleList(source)[Number(cardIndex)];
  const url = objectUrl(item);
  if (url) {
    window.location.href = url;
    return;
  }
  openDetails(cardIndex, source);
}

function specialistCardHtml(specialist) {
  return `
    <article class="specialist-card">
      <img class="specialist-photo" src="${escapeHtml(specialist.photo)}" alt="${escapeHtml(specialist.name)}" loading="lazy">
      <div class="specialist-body">
        <div>
          <p class="specialist-role">${escapeHtml(specialist.role)}</p>
          <h3>${escapeHtml(specialist.name)}</h3>
          ${starsHtml()}
          <a class="specialist-phone" href="${escapeHtml(specialistCallLink(specialist))}">${escapeHtml(specialist.displayPhone)}</a>
        </div>
        <div class="specialist-actions">
          <a class="card-action primary" href="${escapeHtml(specialistWhatsAppLink(specialist))}" target="_blank" rel="noopener">Написать</a>
          <button class="review-button" type="button" data-specialist-reviews="${escapeHtml(specialist.id)}">Отзывы</button>
        </div>
      </div>
    </article>
  `;
}

function specialistModalHtml(specialist) {
  return `
    <div class="specialist-modal">
      <img class="specialist-modal-photo" src="${escapeHtml(specialist.photo)}" alt="${escapeHtml(specialist.name)}" loading="lazy">
      <div class="specialist-modal-info">
        <p class="specialist-role">${escapeHtml(specialist.role)}</p>
        <h2 id="modalTitle">${escapeHtml(specialist.name)}</h2>
        ${starsHtml()}
        <a class="specialist-phone" href="${escapeHtml(specialistCallLink(specialist))}">${escapeHtml(specialist.displayPhone)}</a>
        <div class="review-list" aria-label="Отзывы">
          ${specialist.reviews.map((review) => `
            <blockquote class="review-item">
              <p>${escapeHtml(review)}</p>
              <footer>Оценка: 5 из 5</footer>
            </blockquote>
          `).join("")}
        </div>
        <div class="modal-actions">
          <a class="card-action primary" href="${escapeHtml(specialistWhatsAppLink(specialist))}" target="_blank" rel="noopener">Написать специалисту</a>
          <a class="card-action secondary" href="${escapeHtml(specialistCallLink(specialist))}">Позвонить</a>
        </div>
      </div>
    </div>
  `;
}

function openSpecialistReviews(specialistId) {
  const specialist = SPECIALISTS.find((item) => item.id === specialistId);
  if (!specialist || !objectModal || !modalContent) return;

  modalContent.innerHTML = specialistModalHtml(specialist);
  objectModal.hidden = false;
  document.body.classList.add("modal-open");
  objectModal.querySelector(".modal-close")?.focus();
}

function renderSpecialists() {
  if (!specialistGrid) return;
  specialistGrid.innerHTML = SPECIALISTS.map(specialistCardHtml).join("");
}

function render() {
  if(state.catalogStatus==="error"){showError("Каталог временно недоступен. Повторите загрузку.");return;}
  if(state.catalogStatus==="loading"){showLoading();return;}
  persistCatalogFilters();
  window.LiberterraCompare?.setCatalog(state.objects);
  const list = filteredObjects();
  const requests = requestObjects();
  const count = list.length;
  if (resultCount) resultCount.textContent = `${count} ${pluralObject(count)}`;
  if (requestCount) requestCount.textContent = `${requests.length} ${pluralRequest(requests.length)}`;
  updateFilterUi();
  updateQuickCollections();

  const verifiedCount = state.objects.filter((item) => item.verified).length;
  if (trustLine) trustLine.textContent = `${verifiedCount} проверенных ${pluralObject(verifiedCount)} в Бишкеке`;

  if (grid) {
    if (!count) {
      grid.innerHTML = `
        <div class="state">
          <div>
            <strong>Ничего не нашлось</strong>
            <span>${sourceFilterActive()
              ? `По источнику «${escapeHtml(sourceFilterSummary())}» объектов нет. Снимите фильтр по источнику или измените остальные.`
              : "Сбросьте часть фильтров или оставьте запрос — подберём."}</span>
            ${sourceFilterActive() ? '<button class="state-action" type="button" data-source-reset>Показать все объекты</button>' : ""}
            <a class="state-action" href="https://t.me/Liberterra_kg_bot" target="_blank" rel="noopener">Ищу квартиру</a>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = list.map((item, index) => cardHtml(item, index, "objects")).join("");
    }
  }

  if (!requestGrid) return;
  const previewLimit = Number(requestGrid.dataset?.previewLimit || 0);
  const visibleRequests = previewLimit > 0 ? requests.slice(0, previewLimit) : requests;
  requestGrid.innerHTML = requests.length
    ? visibleRequests.map((item, index) => cardHtml(item, index, "requests")).join("")
    : `
      <div class="state request-state">
        <div>
          <strong>Заявок пока нет</strong>
          <span>Когда арендаторы заполнят поиск в боте, они появятся здесь отдельно.</span>
        </div>
      </div>
    `;
}

function typeLabel(value) {
  return {
    all: "Все типы",
    apartment: "Квартира",
    house: "Дом",
    land: "Участок",
    commercial: "Коммерция",
  }[value] || "Все типы";
}

function roomLabel(value) {
  return value === "all" ? "Комнаты" : `${value} комн.`;
}

function priceLabel() {
  const from = normalize(state.priceMin);
  const to = normalize(state.priceMax);
  const currency = state.priceCurrency === "usd" ? "$" : "сом";
  if (from && to) return `${from}–${to} ${currency}`;
  if (from) return `от ${from} ${currency}`;
  if (to) return `до ${to} ${currency}`;
  return `Цена, ${currency}`;
}

function districtLabel() {
  return state.district === "all" ? "Район" : state.district;
}

function syncChipGroup(group, value) {
  group.querySelectorAll(".chip").forEach((button) => {
    const active = button.dataset.value === value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateHeroSummary(id, label) {
  const summaryText = document.querySelector(`#${id} summary span`);
  if (summaryText) summaryText.textContent = label;
}

function syncHeroButtons(selector, attr, value) {
  document.querySelectorAll(selector).forEach((button) => {
    const active = button.dataset[attr] === value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateFilterUi() {
  if (resetFilters) resetFilters.hidden = !hasActiveFilters();
  if (catalogSearch && catalogSearch.value !== state.query) catalogSearch.value = state.query;
  if (districtFilter && districtFilter.value !== state.district) districtFilter.value = state.district;
  const districtInputValue = state.district === "all" ? "" : state.district;
  if (heroDistrictFilter && heroDistrictFilter.value !== districtInputValue) heroDistrictFilter.value = districtInputValue;
  if (heroPropertyType && heroPropertyType.value !== state.propertyType) heroPropertyType.value = state.propertyType;
  if (filterInputs.priceMin && filterInputs.priceMin.value !== state.priceMin) filterInputs.priceMin.value = state.priceMin;
  if (filterInputs.priceMax && filterInputs.priceMax.value !== state.priceMax) filterInputs.priceMax.value = state.priceMax;
  if (heroPriceMin && heroPriceMin.value !== state.priceMin) heroPriceMin.value = state.priceMin;
  if (heroPriceMax && heroPriceMax.value !== state.priceMax) heroPriceMax.value = state.priceMax;
  if (priceCurrency) {
    if (priceCurrency.value !== state.priceCurrency) priceCurrency.value = state.priceCurrency;
    window.LiberterraPublic?.setCurrency(state.priceCurrency.toUpperCase(), {syncFilter:false});
  }
  const heroCity = document.querySelector('#heroCity');
  if (heroCity) heroCity.value = state.city;
  updateSourceUi();
  if (favoritesFilter) {
    favoritesFilter.classList.toggle('is-active', state.favoritesOnly);
    favoritesFilter.setAttribute('aria-pressed', String(state.favoritesOnly));
    setFavoritesFilterLabel(state.favoritesOnly);
  }

  filterGroups.forEach((group) => {
    const key = group.dataset.filter;
    if (key === "segment") syncChipGroup(group, state.segment);
    if (key === "rooms") syncChipGroup(group, state.rooms);
  });

  syncHeroButtons("[data-hero-type]", "heroType", state.propertyType);
  syncHeroButtons("[data-hero-rooms]", "heroRooms", state.rooms);
  document.querySelectorAll("[data-hero-deal]").forEach((button) => {
    const active = dealSelected(button.dataset.heroDeal);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  syncHeroButtons("[data-rent-term]", "rentTerm", state.rentTerm);
  syncHeroButtons("[data-hero-occupancy]", "heroOccupancy", state.occupancy);
  syncHeroButtons("[data-request-deal]", "requestDeal", state.requestDeal);
  if (rentTermGroup) rentTermGroup.hidden = !dealSelected("аренда");
  document.querySelectorAll(".catalog-occupancy-group").forEach((group) => {
    group.hidden = !dealSelected("аренда");
  });
  updateHeroSummary("heroTypeMenu", typeLabel(state.propertyType));
  updateHeroSummary("heroRoomsMenu", roomLabel(state.rooms));
  updateHeroSummary("heroPriceMenu", priceLabel());
  updateHeroSummary("heroDistrictMenu", districtLabel());

  const countLabel = `${filteredObjects().length} ${pluralObject(filteredObjects().length)}`;
  const ready = state.catalogStatus === "ready";
  const statusLabel = state.catalogStatus === "error" ? "Ошибка загрузки" : "Загружаем…";
  if (heroShowCount) heroShowCount.textContent = ready ? countLabel : statusLabel;
  if (heroShowButton) {
    const label=heroShowButton.querySelector(".search-label");
    if(label)label.textContent=window.LiberterraV20.text(ready?"find":state.catalogStatus==="error"?"unavailable":"loading");
    else if (heroShowButton.firstChild?.nodeType === 3) heroShowButton.firstChild.textContent = ready ? "Показать " : statusLabel;
    heroShowButton.disabled = !ready;
    heroShowButton.setAttribute("aria-busy", String(state.catalogStatus === "loading"));
    heroShowButton.setAttribute("aria-label", ready ? `${window.LiberterraV20?.text("find") || "Показать"} (${filteredObjects().length})` : statusLabel);
  }
}

function setCarouselPhoto(cardIndex, photoIndex) {
  const item = filteredObjects()[Number(cardIndex)];
  if (!grid) return;
  const image = grid.querySelector(`[data-carousel-image="${cardIndex}"]`);
  const dots = [...grid.querySelectorAll(`[data-carousel-card="${cardIndex}"][data-photo-index]`)];
  const activeDot = dots.find((dot) => Number(dot.dataset.photoIndex) === photoIndex);
  const photoUrl = item?.photoUrls?.[photoIndex];
  if (!image || !activeDot || !photoUrl) return;

  image.src = photoUrl;
  dots.forEach((dot) => dot.classList.toggle("is-active", dot === activeDot));
}

function handleGridClick(event) {
  const favoriteButton = event.target.closest("[data-favorite-card]");
  if (favoriteButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(filteredObjects()[Number(favoriteButton.dataset.favoriteCard)]);
    return;
  }
  const shareButton = event.target.closest("[data-share-object-card]");
  if (shareButton) {
    event.preventDefault();
    event.stopPropagation();
    const item = visibleList(shareButton.dataset.shareSource)[Number(shareButton.dataset.shareObjectCard)];
    copyObjectLink(item, shareButton);
    return;
  }

  const control = event.target.closest("[data-carousel-card]");
  if (control) {
    event.preventDefault();
    event.stopPropagation();
    const cardIndex = control.dataset.carouselCard;
    const dots = [...grid.querySelectorAll(`[data-carousel-card="${cardIndex}"][data-photo-index]`)];
    if (!dots.length) return;

    const currentIndex = dots.findIndex((dot) => dot.classList.contains("is-active"));
    if (control.hasAttribute("data-photo-index")) {
      setCarouselPhoto(cardIndex, Number(control.dataset.photoIndex));
      return;
    }

    const step = Number(control.dataset.carouselStep || 0);
    const nextIndex = (currentIndex + step + dots.length) % dots.length;
    setCarouselPhoto(cardIndex, nextIndex);
    return;
  }

  if (event.target.closest("a, button")) return;
  const card = event.target.closest("[data-card-index]");
  if (card) openObjectPage(card.dataset.cardIndex, card.dataset.listSource);
}

function handleGridKeydown(event) {
  if (!["Enter", " "].includes(event.key)) return;
  if (event.target.closest("a, button")) return;
  const card = event.target.closest("[data-card-index]");
  if (!card) return;

  event.preventDefault();
  openObjectPage(card.dataset.cardIndex, card.dataset.listSource);
}

grid?.addEventListener("click", handleGridClick);
grid?.addEventListener("keydown", handleGridKeydown);
requestGrid?.addEventListener("click", handleGridClick);
requestGrid?.addEventListener("keydown", handleGridKeydown);

objectModal?.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-modal]")) closeDetails();
});

specialistGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-specialist-reviews]");
  if (!button) return;
  openSpecialistReviews(button.dataset.specialistReviews);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && objectModal && !objectModal.hidden) {
    closeDetails();
  }
});

const PERSON_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-8 1.7-8 4v2h16v-2c0-2.3-4.7-4-8-4Z"/></svg>';
let sourceStaffQuery = "";

function sourceInitials(value) {
  return normalize(value).split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase()).join("");
}

// Сотрудники в списке: весь публичный реестр плюс имена, встреченные в выдаче.
function sourceStaffEntries() {
  const entries = new Map();
  const add = (name, agency, avatar) => {
    const key = normalizeSearch(name);
    if (!key) return null;
    if (!entries.has(key)) {
      entries.set(key, { key, name: normalize(name), agency: "", avatar: "", count: 0 });
    }
    const entry = entries.get(key);
    if (!entry.agency && normalize(agency)) entry.agency = normalize(agency);
    if (!entry.avatar && normalize(avatar)) entry.avatar = normalize(avatar);
    return entry;
  };
  agentDirectory.forEach((agent) => add(agent.name, agent.agency, agent.avatar));
  state.objects.forEach((item) => {
    if (!dealMatches(item)) return;
    const entry = add(item.sourceAgentName, agentAgencyOf(item), "");
    if (entry) entry.count += 1;
  });
  return [...entries.values()]
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name, "ru"));
}

function sourceGroupRowHtml(group) {
  return `<label class="v20-source-row" data-kind="group">`
    + `<span class="v20-source-ava">${PERSON_ICON}</span>`
    + `<span class="v20-source-text"><span class="v20-source-name">${escapeHtml(SOURCE_LABELS[group])}</span></span>`
    + `<input type="checkbox" data-source="${escapeHtml(group)}">`
    + `</label>`;
}

function sourceStaffRowHtml(entry) {
  const photo = entry.avatar
    ? `<img class="v20-source-photo" src="${escapeHtml(entry.avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : "";
  const meta = entry.agency ? `<span class="v20-source-meta">${escapeHtml(entry.agency)}</span>` : "";
  return `<label class="v20-source-row" data-kind="staff">`
    + `<span class="v20-source-ava">${photo}<span class="v20-source-initials">${escapeHtml(sourceInitials(entry.name))}</span></span>`
    + `<span class="v20-source-text"><span class="v20-source-name">${escapeHtml(entry.name)}</span>${meta}</span>`
    + `<span class="v20-source-num" title="Объектов в выдаче">${entry.count}</span>`
    + `<input type="checkbox" data-staff="${escapeHtml(entry.key)}">`
    + `</label>`;
}

function renderSourceList() {
  const list = document.querySelector("#heroSourceList");
  if (!list) return;
  const query = normalizeSearch(sourceStaffQuery);
  const staff = sourceStaffEntries().filter((entry) => !query
    || normalizeSearch(entry.name).includes(query)
    || normalizeSearch(entry.agency).includes(query));
  const signature = `${query}|${staff.map((entry) => `${entry.key}:${entry.count}`).join(",")}`;
  if (list.dataset.signature !== signature) {
    list.dataset.signature = signature;
    const groups = query ? "" : SOURCE_GROUPS.map(sourceGroupRowHtml).join("");
    const rows = staff.map(sourceStaffRowHtml).join("");
    const divider = groups && rows ? `<span class="v20-source-sep">Сотрудники</span>` : "";
    const empty = staff.length
      ? ""
      : `<p class="v20-source-empty">${query ? "Никого не нашли" : "В выдаче пока нет объявлений с указанным агентом"}</p>`;
    list.innerHTML = `${groups}${divider}${rows}${empty}`;
    list.querySelectorAll("img.v20-source-photo").forEach((img) => {
      img.addEventListener("error", () => img.remove(), { once: true });
    });
  }
  list.querySelectorAll("[data-source]").forEach((input) => {
    input.checked = state.source.includes(input.dataset.source);
  });
  list.querySelectorAll("[data-staff]").forEach((input) => {
    input.checked = state.sourceStaff.includes(input.dataset.staff);
  });
}

function closeSourcePanel() {
  const panel = document.querySelector("#heroSourcePanel");
  const toggle = document.querySelector("#heroSourceToggle");
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function openSourcePanel() {
  const panel = document.querySelector("#heroSourcePanel");
  const toggle = document.querySelector("#heroSourceToggle");
  if (!panel) return;
  panel.hidden = false;
  if (toggle) toggle.setAttribute("aria-expanded", "true");
  const search = panel.querySelector("#heroSourceSearch");
  if (search) search.focus();
}

function updateSourceUi() {
  const box = document.querySelector("#heroSource");
  if (!box) return;
  box.hidden = !viewer;
  if (!viewer) {
    closeSourcePanel();
    return;
  }
  renderSourceList();
  const picked = state.source.length + state.sourceStaff.length;
  const value = box.querySelector("#heroSourceValue");
  const badge = box.querySelector("#heroSourceBadge");
  const toggle = box.querySelector("#heroSourceToggle");
  if (value) value.textContent = picked ? sourceFilterSummary() : "Любой источник";
  if (badge) {
    badge.hidden = picked === 0;
    badge.textContent = String(picked);
  }
  if (toggle) toggle.classList.toggle("is-active", picked > 0);
}

function initSourceFilter() {
  const box = document.querySelector("#heroSource");
  if (!box) return;
  const toggle = box.querySelector("#heroSourceToggle");
  const search = box.querySelector("#heroSourceSearch");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const panel = box.querySelector("#heroSourcePanel");
      if (panel && panel.hidden) openSourcePanel();
      else closeSourcePanel();
    });
  }
  if (search) {
    search.addEventListener("input", () => {
      sourceStaffQuery = search.value || "";
      renderSourceList();
    });
  }
  box.addEventListener("change", (event) => {
    const group = event.target.closest("[data-source]");
    if (group) {
      const name = group.dataset.source;
      state.source = group.checked
        ? [...new Set([...state.source, name])]
        : state.source.filter((value) => value !== name);
      render();
      return;
    }
    const staff = event.target.closest("[data-staff]");
    if (staff) {
      const key = staff.dataset.staff;
      state.sourceStaff = staff.checked
        ? [...new Set([...state.sourceStaff, key])]
        : state.sourceStaff.filter((value) => value !== key);
      render();
    }
  });
  box.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeSourcePanel();
    if (toggle) toggle.focus();
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-source-reset]")) {
      state.source = [];
      state.sourceStaff = [];
      sourceStaffQuery = "";
      if (search) search.value = "";
      render();
      return;
    }
    if (!event.target.closest("#heroSource")) closeSourcePanel();
  });
}

function initFilters() {
  filterGroups.forEach((group) => {
    const key = group.dataset.filter;
    if (!key) return;
    group.querySelectorAll(".chip").forEach((button) => {
      button.addEventListener("click", () => {
        group.querySelectorAll(".chip").forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");
        state[key] = button.dataset.value;
        if (key === "segment") {
          state.propertyType = button.dataset.value === "Коммерция" ? "commercial" : "all";
        }
        render();
      });
    });
  });
}

function initSearch() {
  if (!catalogSearch) return;
  catalogSearch.addEventListener("input", () => {
    state.query = catalogSearch.value;
    render();
  });
}

function updateDistrictOptions() {
  const current = state.district;
  const options = `
    <option value="all">Любой район</option>
    ${DISTRICT_OPTIONS.map((district) => `<option value="${escapeHtml(district)}">${escapeHtml(district)}</option>`).join("")}
  `;
  if (districtFilter) {
    districtFilter.innerHTML = options;
    districtFilter.value = DISTRICT_OPTIONS.includes(current) ? current : "all";
  }
  if (heroDistrictOptions) {
    heroDistrictOptions.innerHTML = DISTRICT_OPTIONS
      .map((district) => `<option value="${escapeHtml(district)}"></option>`)
      .join("");
  }
  if (heroDistrictFilter) {
    heroDistrictFilter.value = current === "all" ? "" : current;
  }
}

function initFieldFilters() {
  const setFavoritesFilterLabel = (active = false) => {
    if (!favoritesFilter) return;
    const compactHomeControl = document.body.classList.contains("home-redesign");
    favoritesFilter.textContent = compactHomeControl ? (active ? "♥" : "♡") : (active ? "♥ Избранное" : "♡ Избранное");
    favoritesFilter.setAttribute("aria-label", active ? "Убрать фильтр избранного" : "Показать избранное");
    favoritesFilter.setAttribute("title", active ? "Убрать фильтр избранного" : "Избранное");
  };
  document.querySelectorAll("[data-collection]").forEach((button) => {
    button.addEventListener("click", () => {
      const collection = QUICK_COLLECTIONS.find((item) => item.id === button.dataset.collection);
      if (!collection) return;
      Object.assign(state, collectionFilters(collection));
      state.quickCollection = collection.id;
      if (favoritesFilter) {
        favoritesFilter.classList.remove("is-active");
        favoritesFilter.setAttribute("aria-pressed", "false");
        setFavoritesFilterLabel(false);
      }
      render();
      document.querySelector("#catalogGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  favoritesFilter?.addEventListener("click", () => {
    state.favoritesOnly = !state.favoritesOnly;
    favoritesFilter.classList.toggle("is-active", state.favoritesOnly);
    favoritesFilter.setAttribute("aria-pressed", String(state.favoritesOnly));
    setFavoritesFilterLabel(state.favoritesOnly);
    render();
  });

  if (districtFilter) {
    districtFilter.addEventListener("change", () => {
      state.district = districtFilter.value;
      render();
    });
  }

  if (heroDistrictFilter) {
    heroDistrictFilter.addEventListener("input", () => {
      state.district = normalize(heroDistrictFilter.value) || "all";
      render();
    });
  }

  if (heroPropertyType) {
    heroPropertyType.addEventListener("change", () => {
      state.propertyType = heroPropertyType.value || "all";
      state.segment = state.propertyType === "commercial"
        ? "Коммерция"
        : state.propertyType === "all"
          ? "all"
          : "Жильё";
      render();
    });
  }

  document.querySelectorAll("[data-hero-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.propertyType = button.dataset.heroType || "all";
      state.segment = state.propertyType === "commercial"
        ? "Коммерция"
        : state.propertyType === "all"
          ? "all"
          : "Жильё";
      button.closest("details")?.removeAttribute("open");
      render();
    });
  });

  document.querySelectorAll("[data-hero-rooms]").forEach((button) => {
    button.addEventListener("click", () => {
      state.rooms = button.dataset.heroRooms || "all";
      button.closest("details")?.removeAttribute("open");
      render();
    });
  });

  document.querySelectorAll("[data-hero-deal]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.heroDeal || "аренда";
      state.deals = [value];
      if (!dealSelected("аренда")) state.occupancy = "all";
      render();
    });
  });

  document.querySelectorAll("[data-rent-term]").forEach((button) => {
    button.addEventListener("click", () => {
      state.rentTerm = button.dataset.rentTerm || "monthly";
      if (!dealSelected("аренда")) state.deals = ["аренда"];
      render();
    });
  });

  document.querySelectorAll("[data-hero-occupancy]").forEach((button) => {
    button.addEventListener("click", () => {
      state.occupancy = button.dataset.heroOccupancy || "all";
      if (state.occupancy === "sharing" && !dealSelected("аренда")) state.deals = ["аренда"];
      render();
    });
  });

  document.querySelectorAll("[data-request-deal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.requestDeal = button.dataset.requestDeal || "all";
      render();
    });
  });

  heroPriceMin?.addEventListener("input", () => {
    state.priceMin = heroPriceMin.value;
    render();
  });
  heroPriceMax?.addEventListener("input", () => {
    state.priceMax = heroPriceMax.value;
    render();
  });
  priceCurrency?.addEventListener("change", () => {
    state.priceCurrency = priceCurrency.value || "kgs";
    render();
  });

  heroShowButton?.addEventListener("click", () => {
    document.querySelector("#catalogGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  Object.entries(filterInputs).forEach(([key, input]) => {
    if (!input) return;
    input.addEventListener("input", () => {
      state[key] = input.value;
      render();
    });
  });

  resetFilters?.addEventListener("click", () => {
    state.segment = "all";
    state.city = "all";
    state.favoritesOnly = false;
    state.requestDeal = "all";
    state.rentTerm = "monthly";
    state.propertyType = "all";
    state.occupancy = "all";
    state.rooms = "all";
    state.district = "all";
    state.query = "";
    state.priceMin = "";
    state.priceMax = "";
    state.areaMin = "";
    state.areaMax = "";
    state.floorMin = "";
    state.floorMax = "";
    state.source = [];
    state.sourceStaff = [];

    if (catalogSearch) catalogSearch.value = "";
    if (districtFilter) districtFilter.value = "all";
    Object.values(filterInputs).forEach((input) => {
      if (input) input.value = "";
    });

    filterGroups.forEach((group) => {
      const key = group.dataset.filter;
      if (!key) return;
      group.querySelectorAll(".chip").forEach((button) => {
        const active = button.dataset.value === "all";
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });

    render();
  });
}

function initCatalogFilterDisclosure() {
  if (!toggleCatalogFilters || !catalogFilterOptions) return;

  const mobileQuery = window.matchMedia("(max-width: 680px)");
  let mobileExpanded = false;

  const applyLayout = () => {
    const expanded = mobileQuery.matches ? mobileExpanded : true;
    catalogFilterOptions.hidden = !expanded;
    toggleCatalogFilters.setAttribute("aria-expanded", String(expanded));
  };

  toggleCatalogFilters.addEventListener("click", () => {
    mobileExpanded = !mobileExpanded;
    applyLayout();
  });

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", applyLayout);
  } else {
    mobileQuery.addListener(applyLayout);
  }

  applyLayout();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);

  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])));
}

function setObjects(rows) {
  state.catalogStatus = "ready";
  const publishedItems = latestObjectVersions(rows
    .map(normalizeRow)
    
    .filter((item) => ["аренда", "продажа", "запрос"].includes(normalize(item.deal).toLowerCase()) || item.isRequest))
    .filter((item) => normalize(item.status).toLowerCase() === "опубликован");

  state.objects = uniqueObjects(publishedItems.filter((item) => !item.isRequest && ["аренда", "продажа"].includes(normalize(item.deal).toLowerCase())));
  state.requests = sortRequestsNewestFirst(
    uniqueObjects(publishedItems.filter((item) => item.isRequest)),
  );
  updateDistrictOptions();
  const citySelect=document.querySelector("#heroCity");
  globalThis.LiberterraGeo.populate(citySelect,state.objects,state.city);
  render();
}

function freshCatalogCsvUrl() {
  const url = new URL(SHEET_CSV_URL, window.location.href);
  url.searchParams.set("catalog_fresh", String(Date.now()));
  return url.toString();
}

let catalogFetchPromise = null;
let lastCatalogCheckAt = 0;
function loadObjectsWithFetch() {
  if (catalogFetchPromise) return catalogFetchPromise;
  lastCatalogCheckAt = Date.now();
  catalogFetchPromise = fetchCurrentCatalog().finally(() => { catalogFetchPromise = null; });
  return catalogFetchPromise;
}

async function fetchCurrentCatalog(attempt = 0) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    let response = await fetch(freshCatalogCsvUrl(), { cache: "no-store", signal: controller.signal });
    if (!response.ok) {const error=new Error(`HTTP ${response.status}`);error.retryable=response.status>=500||response.status===429;throw error;}
    const text = await response.text();
    if(/^\s*</.test(text)||!text.split(/\r?\n/)[0].includes("status"))throw new Error("Некорректный ответ каталога");
    const rows = parseCsv(text);
    setObjects(rows);
    document.documentElement.dataset.catalogRefreshedMs = String(Math.round(performance.now()));
  } catch (error) {
    if(attempt===0 && (error.retryable||error.name==="AbortError"||error instanceof TypeError)){window.clearTimeout(timeout);await new Promise(r=>setTimeout(r,600));return fetchCurrentCatalog(1);}
    state.objects = [];
    state.requests = [];
    showError(error.name === "AbortError" ? "Сервис отвечает дольше обычного. Обновите страницу." : error.message || "Проверьте ссылку на CSV-таблицу.");
  } finally {
    window.clearTimeout(timeout);
  }
}

function revalidateVisibleCatalog() {
  if (document.visibilityState === "hidden" || Date.now() - lastCatalogCheckAt < 2000) return;
  loadObjectsWithFetch();
}

// Do not flash a bundled snapshot: counts, owners and request state must
// always come from the current response.
function loadObjects() {
  showLoading();
  state.objects = [];
  state.requests = [];

  if (!SHEET_CSV_URL) {
    showError("Добавьте опубликованную CSV-ссылку Google Sheets в константу SHEET_CSV_URL в script.js.");
    return;
  }

  loadObjectsWithFetch();
}

if (!document.body.classList.contains("submission-page")) {
  initFilters();
  initSearch();
  initFieldFilters();
  initCatalogFilterDisclosure();
  initSourceFilter();
  resolveViewer();
  renderSpecialists();
  loadObjects();
  window.addEventListener("focus", revalidateVisibleCatalog);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) revalidateVisibleCatalog();
  });
  document.addEventListener("visibilitychange", revalidateVisibleCatalog);
}

window.addEventListener("liberterra:agent-role", () => {
  resolveViewer();
  render();
  syncAccountFavorites();
});
window.addEventListener("liberterra:user-registered", () => {
  viewerRequested = false;
  resolveViewer();
  syncAccountFavorites();
});
window.setTimeout(syncAccountFavorites, 1200);

document.querySelector("#heroCity")?.addEventListener("change",e=>{state.city=e.target.value;render()});
document.addEventListener("click",e=>{if(e.target.closest("[data-catalog-retry]")){showLoading();loadObjectsWithFetch();}});
window.addEventListener("liberterra:languagechange",()=>{updateFilterUi()});

globalThis.LiberterraGeo.populate(document.querySelector("#heroCity"),state.objects,state.city);
