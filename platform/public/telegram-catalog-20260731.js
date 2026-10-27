const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLuXrGqbh_4ntwRLXn3_jrbO_MdAYlcBYwJGSM8sTXgpW9u-Rri696yqWiIIvFWIbSREGwoZ5fbYiF/pub?gid=832519304&single=true&output=csv";
const RENT_CONTACT_URL = "https://wa.me/996500804402";
const SALE_CONTACT_URL = "https://wa.me/996500804402";
const HERO_IMAGE = "assets/hero-building.webp";
const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";
const PHOTO_FALLBACK_ORIGIN = window.location.origin;

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
  deal: "аренда",
  segment: "all",
  propertyType: "all",
  rooms: "all",
  district: "all",
  priceCurrency: "kgs",
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
};

const grid = document.querySelector("#catalogGrid");
const requestGrid = document.querySelector("#requestGrid");
const resultCount = document.querySelector("#resultCount");
const requestCount = document.querySelector("#requestCount");
const trustLine = document.querySelector("#trustLine");
const filterGroups = document.querySelectorAll(".filter-group");
const catalogSearch = document.querySelector("#catalogSearch");
const districtFilter = document.querySelector("#districtFilter");
const heroDistrictFilter = document.querySelector("#heroDistrictFilter");
const heroShowButton = document.querySelector("#heroShowButton");
const heroShowCount = document.querySelector("#heroShowCount");
const heroPriceMin = document.querySelector("#heroPriceMin");
const heroPriceMax = document.querySelector("#heroPriceMax");
const priceCurrency = document.querySelector("#priceCurrency");
const resetFilters = document.querySelector("#resetFilters");
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
  if (hasPriceFilter && item.priceCurrency && item.priceCurrency !== state.priceCurrency) return false;
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
  const per = displayPer(item);
  return `${escapeHtml(item.price)}${per ? ` <small>${escapeHtml(per)}</small>` : ""}`;
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
      /^https:\/\/(?:liberterra-kg-catalog\.pages\.dev|hidden-pine-cbff\.mirbekbekov\.workers\.dev)\/uploads\//i,
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

function idFromLink(link) {
  const match = normalize(link).match(/object_([^&\s]+)/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function normalizeRow(row) {
  const segment = normalize(row.segment);
  const deal = normalize(row.deal) || "Аренда";
  const tgLink = normalize(row.tg_link);
  const isRequest = rowIsRequest(row);
  const requestDeal = isRequest ? detectRequestDeal(row) : "";
  return {
    id: normalize(row.id) || idFromLink(tgLink),
    status: normalize(row.status),
    tgLink,
    contactLink: tgLink,
    contactPhone: phoneFromWhatsappLink(tgLink),
    phone: normalize(row.phone || row.phone_number || row.contact_phone || row.contact),
    contactName: normalize(row.contact_name || row.owner_name || row.telegram_full_name || row.telegram_username),
    posterType: normalize(row.poster_type),
    listingAgentName: normalize(row.listing_agent_name),
    listingAgentAgency: normalize(row.listing_agent_agency),
    listingAgentPublicRef: normalize(row.listing_agent_public_ref),
    isRequest,
    requestDeal,
    segment,
    city: normalize(row.city) || "Бишкек",
    deal,
    dealLabel: isRequest ? requestActionLabel(requestDeal, segment) : deal,
    propertyType: detectPropertyType(row),
    rooms: normalize(row.rooms),
    roomsText: roomText(row),
    price: normalize(row.price) || "Цена по запросу",
    priceNumber: numberFromText(row.price),
    priceCurrency: currencyFromPrice(row.price),
    per: normalize(row.per),
    title: isRequest
      ? requestTitleLabel(row, requestDeal, segment)
      : normalize(row.title) || "Объект недвижимости",
    area: normalize(row.area),
    areaNumber: numberFromText(row.area),
    floor: normalize(row.floor),
    floorNumber: numberFromText(row.floor),
    district: normalize(row.district) || "Район уточняется",
    verified: isVerified(row.verified),
    photoUrls: photoUrls(row.photo_url),
    description: normalize(row.description || row.extra || row["Описание"] || row["описание"] || row.wishes || row.comment || row.notes),
    year: normalize(row.year),
    documents: normalize(row.documents),
    condition: normalize(row.condition),
    landArea: normalize(row.land_area),
  };
}

function objectUrl(item) {
  return item?.id ? `/object?id=${encodeURIComponent(item.id)}` : "";
}

function publicObjectUrl(item) {
  const path = objectUrl(item);
  return path ? new URL(path, window.location.origin).href : "";
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
  if (!publicObjectUrl(item)) return;

  try {
    await navigator.clipboard.writeText(shareText(item));
    const originalLabel = button.textContent;
    button.textContent = "Скопировано";
    button.classList.add("is-copied");
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove("is-copied");
    }, 1800);
  } catch {
    window.prompt("Скопируйте текст для отправки", shareText(item));
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
    const key = item.id || item.tgLink || objectKey(item);
    byKey.set(key, item);
  });
  return Array.from(byKey.values());
}

function enrichRowsWithLocalData(rows) {
  const localRows = Array.isArray(window.LIBERTERRA_LOCAL_OBJECTS) ? window.LIBERTERRA_LOCAL_OBJECTS : [];
  if (!localRows.length) return rows;

  const localById = new Map();
  localRows.forEach((row) => {
    const id = normalize(row.id) || idFromLink(row.tg_link);
    if (id) localById.set(id, row);
  });

  return rows.map((row) => {
    const id = normalize(row.id) || idFromLink(row.tg_link);
    const fallback = id ? localById.get(id) : null;
    if (!fallback) return row;

    const merged = { ...row };
    Object.entries(fallback).forEach(([key, value]) => {
      if (!normalize(merged[key]) && normalize(value)) merged[key] = value;
    });
    return merged;
  });
}

function showLoading() {
  if (resultCount) resultCount.textContent = "Загружаем объекты...";
  if (requestCount) requestCount.textContent = "Загружаем заявки...";
  if (trustLine) trustLine.textContent = "Загружаем проверенные объекты в Бишкеке";
  if (grid) grid.innerHTML = Array.from({ length: 6 }, () => `<div class="skeleton" aria-hidden="true"></div>`).join("");
  if (requestGrid) requestGrid.innerHTML = "";
}

function showError(message) {
  if (resultCount) resultCount.textContent = "Ошибка загрузки";
  if (requestCount) requestCount.textContent = "Ошибка загрузки";
  if (trustLine) trustLine.textContent = "Каталог временно недоступен";
  const errorHtml = `
    <div class="state">
      <div>
        <strong>Не удалось загрузить объекты</strong>
        <span>${escapeHtml(message)}</span>
      </div>
    </div>
  `;
  if (grid) grid.innerHTML = errorHtml;
  if (requestGrid) requestGrid.innerHTML = errorHtml;
}

function filteredObjects() {
  const query = normalizeSearch(state.query);
  return state.objects.filter((item) => {
    const byDeal =
      normalize(item.deal).toLowerCase() === state.deal;
    if (!byDeal) return false;

    const bySegment =
      state.segment === "all"
      || item.segment === state.segment;
    if (!bySegment) return false;
    if (!typeMatches(item)) return false;

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

    if (!priceMatches(item)) return false;
    if (!withinRange(item.areaNumber, state.areaMin, state.areaMax)) return false;
    if (!withinRange(item.floorNumber, state.floorMin, state.floorMax)) return false;

    if (!query) return true;
    const haystack = normalizeSearch([
      item.title,
      item.district,
      item.description,
    ].filter(Boolean).join(" "));
    return haystack.includes(query);
  });
}

function hasActiveFilters() {
  return state.deal !== "аренда"
    || state.segment !== "all"
    || state.propertyType !== "all"
    || state.rooms !== "all"
    || state.district !== "all"
    || state.priceCurrency !== "kgs"
    || Boolean(normalize(state.query))
    || Boolean(normalize(state.priceMin))
    || Boolean(normalize(state.priceMax))
    || Boolean(normalize(state.areaMin))
    || Boolean(normalize(state.areaMax))
    || Boolean(normalize(state.floorMin))
    || Boolean(normalize(state.floorMax));
}

function requestObjects() {
  if (state.requestDeal === "all") return state.requests;
  return state.requests.filter((item) => item.requestDeal === state.requestDeal);
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
      <img src="${escapeHtml(item.photoUrls[0])}" alt="${escapeHtml(item.title)}" loading="${cardIndex < 3 ? "eager" : "lazy"}" decoding="async" fetchpriority="${cardIndex < 3 ? "high" : "low"}" data-carousel-image="${cardIndex}">
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
  const saleSpecs = isSaleDeal(item) ? [item.year && `${item.year} г.`, item.documents, item.condition, item.landArea].filter(Boolean) : [];
  const specs = [item.roomsText, item.area, item.floor, ...saleSpecs].filter(Boolean);
  const url = objectUrl(item);
  return `
    <article class="card${item.isRequest ? ` request-card${requestCardClass(item)}` : ""}" data-card-index="${cardIndex}" data-list-source="${escapeHtml(source)}"${url ? ` data-object-url="${escapeHtml(url)}"` : ""} role="link" tabindex="0" aria-label="${item.isRequest ? "Открыть заявку" : "Открыть страницу объекта"}: ${escapeHtml(item.title)}">
      <div class="photo">
        ${cardPhoto(item, cardIndex)}
        <div class="badge-row">
          ${item.verified ? `<span class="badge">Проверен</span>` : ""}
          ${window.LiberterraAgentAccess?.contractVerifiedBadgeHtml(item) || ""}
          <span class="deal-tag${item.isRequest ? ` request-tag ${item.requestDeal === "buy" ? "request-tag-buy" : "request-tag-rent"}` : ""}">${escapeHtml(item.dealLabel)}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="price">${priceHtml(item)}</div>
        ${window.LiberterraAgentAccess?.commissionBadgeHtml(item, "card") || ""}
        <p class="title">${escapeHtml(item.title)}</p>
        <div class="district">${pinSvg}<span>${escapeHtml(item.district)}</span></div>
        <div class="specs">
          ${specs.map((spec) => `<span class="spec">${escapeHtml(spec)}</span>`).join("")}
        </div>
        ${attributionHtml(item)}
        <div class="card-actions">
          <a class="card-action primary" href="${escapeHtml(contactLink(item))}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="card-action secondary" href="${escapeHtml(callLink(item))}">Позвонить</a>
          ${url ? `<button class="card-action share" type="button" data-share-object-card="${cardIndex}" data-share-source="${escapeHtml(source)}">Скопировать ссылку</button>` : ""}
        </div>
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
          ${item.verified ? `<span class="badge">Проверен</span>` : ""}
          ${window.LiberterraAgentAccess?.contractVerifiedBadgeHtml(item) || ""}
          <span class="deal-tag${item.isRequest ? ` request-tag ${item.requestDeal === "buy" ? "request-tag-buy" : "request-tag-rent"}` : ""}">${escapeHtml(item.dealLabel)}</span>
          <span class="segment-tag">${escapeHtml(item.segment)}</span>
        </div>
        <h2 id="modalTitle">${escapeHtml(item.title)}</h2>
        <div class="modal-price">${priceHtml(item)}</div>
        ${window.LiberterraAgentAccess?.commissionBadgeHtml(item, "modal") || ""}
        <div class="modal-location">${pinSvg}<span>${escapeHtml(item.district)}</span></div>
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
          ${isSaleDeal(item) ? detailRow("Год постройки", item.year) : ""}
          ${isSaleDeal(item) ? detailRow("Документы", item.documents) : ""}
          ${isSaleDeal(item) ? detailRow("Состояние", item.condition) : ""}
          ${isSaleDeal(item) ? detailRow("Площадь участка", item.landArea) : ""}
          ${detailRow("Контакт", displayPhone(item))}
        </div>
        <div class="modal-actions">
          <a class="card-action primary" href="${escapeHtml(contactLink(item))}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="card-action secondary" href="${escapeHtml(callLink(item))}">Позвонить</a>
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
  const list = filteredObjects();
  const requests = requestObjects();
  const count = list.length;
  if (resultCount) resultCount.textContent = `${count} ${pluralObject(count)}`;
  if (requestCount) requestCount.textContent = `${requests.length} ${pluralRequest(requests.length)}`;
  updateFilterUi();

  const verifiedCount = state.objects.filter((item) => item.verified).length;
  if (trustLine) trustLine.textContent = `${verifiedCount} проверенных ${pluralObject(verifiedCount)} в Бишкеке`;

  if (grid) {
    if (!count) {
      grid.innerHTML = `
        <div class="state">
          <div>
            <strong>Ничего не нашлось</strong>
            <span>Сбросьте часть фильтров или оставьте запрос — подберём.</span>
            <a class="state-action" href="https://t.me/Liberterra_kg_bot" target="_blank" rel="noopener">Ищу квартиру</a>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = list.map((item, index) => cardHtml(item, index, "objects")).join("");
    }
  }

  if (!requestGrid) return;
  requestGrid.innerHTML = requests.length
    ? requests.map((item, index) => cardHtml(item, index, "requests")).join("")
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
  if (heroDistrictFilter && heroDistrictFilter.value !== state.district) heroDistrictFilter.value = state.district;
  if (filterInputs.priceMin && filterInputs.priceMin.value !== state.priceMin) filterInputs.priceMin.value = state.priceMin;
  if (filterInputs.priceMax && filterInputs.priceMax.value !== state.priceMax) filterInputs.priceMax.value = state.priceMax;
  if (heroPriceMin && heroPriceMin.value !== state.priceMin) heroPriceMin.value = state.priceMin;
  if (heroPriceMax && heroPriceMax.value !== state.priceMax) heroPriceMax.value = state.priceMax;
  if (priceCurrency && priceCurrency.value !== state.priceCurrency) priceCurrency.value = state.priceCurrency;

  filterGroups.forEach((group) => {
    const key = group.dataset.filter;
    if (key === "segment") syncChipGroup(group, state.segment);
    if (key === "rooms") syncChipGroup(group, state.rooms);
  });

  syncHeroButtons("[data-hero-type]", "heroType", state.propertyType);
  syncHeroButtons("[data-hero-rooms]", "heroRooms", state.rooms);
  syncHeroButtons("[data-hero-deal]", "heroDeal", state.deal);
  syncHeroButtons("[data-request-deal]", "requestDeal", state.requestDeal);
  updateHeroSummary("heroTypeMenu", typeLabel(state.propertyType));
  updateHeroSummary("heroRoomsMenu", roomLabel(state.rooms));
  updateHeroSummary("heroPriceMenu", priceLabel());
  updateHeroSummary("heroDistrictMenu", districtLabel());

  const countLabel = `${filteredObjects().length} ${pluralObject(filteredObjects().length)}`;
  if (heroShowCount) heroShowCount.textContent = countLabel;
  if (heroShowButton) heroShowButton.setAttribute("aria-label", `Показать ${countLabel}`);
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
  [districtFilter, heroDistrictFilter].forEach((select) => {
    if (!select) return;
    select.innerHTML = options;
    select.value = DISTRICT_OPTIONS.includes(current) ? current : "all";
  });
  state.district = DISTRICT_OPTIONS.includes(current) ? current : "all";
}

function initFieldFilters() {
  if (districtFilter) {
    districtFilter.addEventListener("change", () => {
      state.district = districtFilter.value;
      render();
    });
  }

  if (heroDistrictFilter) {
    heroDistrictFilter.addEventListener("change", () => {
      state.district = heroDistrictFilter.value;
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
      state.deal = button.dataset.heroDeal || "аренда";
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
    state.deal = "аренда";
    state.propertyType = "all";
    state.rooms = "all";
    state.district = "all";
    state.priceCurrency = "kgs";
    state.query = "";
    state.priceMin = "";
    state.priceMax = "";
    state.areaMin = "";
    state.areaMax = "";
    state.floorMin = "";
    state.floorMax = "";

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
  const publishedItems = latestObjectVersions(rows
    .map(normalizeRow)
    .filter((item) => normalize(item.city).toLowerCase() === "бишкек")
    .filter((item) => ["аренда", "продажа", "запрос"].includes(normalize(item.deal).toLowerCase()) || item.isRequest))
    .filter((item) => normalize(item.status).toLowerCase() === "опубликован");

  state.objects = uniqueObjects(publishedItems.filter((item) => !item.isRequest && ["аренда", "продажа"].includes(normalize(item.deal).toLowerCase())));
  state.requests = uniqueObjects(publishedItems.filter((item) => item.isRequest));
  updateDistrictOptions();
  render();
}

async function loadObjectsWithFetch(errorFromParser) {
  try {
    const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    setObjects(enrichRowsWithLocalData(parseCsv(text)));
  } catch (error) {
    showError(errorFromParser?.message || error.message || "Проверьте ссылку на CSV-таблицу.");
  }
}

function loadObjects() {
  showLoading();

  if (!SHEET_CSV_URL) {
    showError("Добавьте опубликованную CSV-ссылку Google Sheets в константу SHEET_CSV_URL в script.js.");
    return;
  }

  if (!window.Papa?.parse) {
    loadObjectsWithFetch();
    return;
  }

  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete(results) {
      setObjects(enrichRowsWithLocalData(results.data));
    },
    error(error) {
      loadObjectsWithFetch(error);
    },
  });
}

initFilters();
initSearch();
initFieldFilters();
renderSpecialists();
loadObjects();

window.addEventListener("liberterra:agent-role", () => {
  render();
});
