const SHEET_CSV_URL = "/api/public-catalog";
const BOT_LINK = "https://t.me/Liberterra_kg_bot";
const RENT_PHONE_DISPLAY = "0500 804 402";
const RENT_PHONE_TEL = "tel:+996500804402";
const SALE_PHONE_DISPLAY = "0500 804 402";
const SALE_PHONE_TEL = "tel:+996500804402";
const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";
const PHOTO_FALLBACK_ORIGIN = window.location.origin;

document.documentElement.dataset.objectScriptStartedMs = String(Math.round(performance.now()));

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.photoFallbackDone === "true") return;
  const source = image.currentSrc || image.src;
  if (!source.startsWith(`${PHOTO_DELIVERY_ORIGIN}/uploads/`)) return;
  image.dataset.photoFallbackDone = "true";
  image.src = source.replace(`${PHOTO_DELIVERY_ORIGIN}/uploads/`, `${PHOTO_FALLBACK_ORIGIN}/uploads/`);
}, true);

const objectPage = document.querySelector("#objectPage");
let currentObject = null;
let activePhotoIndex = 0;
let visibleObjects = [];

const pinSvg = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 2.25c-3.92 0-7.1 3.07-7.1 6.86 0 5.15 7.1 12.64 7.1 12.64s7.1-7.49 7.1-12.64c0-3.79-3.18-6.86-7.1-6.86Zm0 9.6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
  </svg>
`;

const userSvg = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5.5 20c.45-4.05 2.62-6.1 6.5-6.1s6.05 2.05 6.5 6.1" />
  </svg>
`;

function normalize(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return normalize(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isVerified(value) {
  return ["true", "1", "yes", "да", "истина"].includes(normalize(value).toLowerCase());
}

function roomText(row) {
  const rooms = Number.parseInt(normalize(row.rooms), 10);
  if (!Number.isFinite(rooms) || rooms <= 0) return "";
  if (rooms === 1) return "1 комната";
  if (rooms >= 2 && rooms <= 4) return `${rooms} комнаты`;
  return `${rooms} комнат`;
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

function idFromLink(link) {
  const match = normalize(link).match(/object_([^&\s]+)/i);
  return match ? decodeURIComponent(match[1]) : "";
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

function getObjectId() {
  const url = new URL(window.location.href);
  const queryId = normalize(url.searchParams.get("id"));
  if (queryId) return queryId;

  const match = url.pathname.match(/\/object\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function requestAuthorNameFromDescription(value) {
  const match = normalize(value).match(/(?:^|\n)\s*Имя\s*:\s*([^\n]+)/i);
  return normalize(match?.[1]);
}

function requestDealFromRow(row) {
  const text = normalize([
    row.request_deal,
    row.request_type,
    row.description,
    row.title,
  ].filter(Boolean).join(" ")).toLowerCase();
  return /покуп|куплю|купит/.test(text) ? "buy" : "rent";
}

function normalizeRow(row) {
  const websiteFields = window.LiberterraListingFormat.websiteFields(row);
  const deal = normalize(row.deal);
  const isRequest = deal.toLowerCase() === "запрос";
  const tgLink = normalize(row.tg_link);
  const description = normalize(row.description || row.extra || row["Описание"] || row["описание"] || row.wishes || row.comment || row.notes);
  const directContactName = normalize(row.contact_name || row.owner_name || row.agent_name || row.telegram_full_name || row.telegram_username);
  return {
    id: normalize(row.id) || idFromLink(tgLink),
    status: normalize(row.status),
    segment: normalize(row.segment),
    city: normalize(row.city) || "Бишкек",
    deal,
    dealLabel: isRequest ? "Ищут" : deal,
    isRequest,
    requestDeal: isRequest ? requestDealFromRow(row) : "",
    rooms: normalize(row.rooms),
    roomsText: roomText(row),
    price: window.LiberterraListingFormat.price(row.price) || "Цена по запросу",
    per: websiteFields.per,
    title: websiteFields.title || "Объект недвижимости",
    area: websiteFields.area,
    floor: websiteFields.floor,
    district: normalize(row.district) || "Район уточняется",
    verified: isVerified(row.verified),
    photoUrls: photoUrls(row.photo_url),
    tgLink,
    // Public contact numbers use a dedicated field; raw source phone values
    // are never read from the public catalogue.
    phone: normalize(row.public_contact_phone),
    contactName: directContactName || (isRequest ? requestAuthorNameFromDescription(description) : ""),
    listingAgentName: normalize(row.listing_agent_name),
    listingAgentAgency: normalize(row.listing_agent_agency),
    listingAgentPublicRef: normalize(row.listing_agent_public_ref),
    description,
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
    isShared: Boolean(normalize(row.occupancy_type) && normalize(row.occupancy_type) !== "Весь объект"),
    material: normalize(row.material || row.house_material || row.materials || row.series || row.house_series),
    publishedDate: normalize(row.published_at || row.created_at || (isRequest ? row.updated_at : "") || row.date || row["Дата"] || row.created || row.timestamp),
    actualDate: normalize(row.actuality_confirmed_at || row.updated_at || row.actualized_at || row.date || row.created_at || row.created || row.timestamp),
  };
}

function latestObjectVersions(items) {
  const byId = new Map();
  items.forEach((item) => {
    if (item.id) byId.set(item.id, item);
  });
  return Array.from(byId.values());
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

function formatDate(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) return normalize(value);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function actualityAge(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return null;
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return { label: "подтверждено сегодня", tone: "fresh" };
  if (days === 1) return { label: "1 день назад", tone: "fresh" };
  if (days <= 7) return { label: `${days} ${days <= 4 ? "дня" : "дней"} назад`, tone: "fresh" };
  if (days < 14) return { label: "неделю назад", tone: "aging" };
  const weeks = Math.floor(days / 7);
  return { label: `${weeks} ${weeks === 1 ? "неделю" : weeks <= 4 ? "недели" : "недель"} назад`, tone: "stale" };
}

function objectDatesHtml(item) {
  const published = formatDate(item.publishedDate);
  if (item.isRequest) {
    const age = actualityAge(item.publishedDate);
    return `
      <div class="object-dates request-submitted${published ? "" : " is-missing"}" aria-label="Дата поступления заявки">
        <span>${published ? `Заявка поступила: ${escapeHtml(published)}${age ? ` · ${escapeHtml(age.label.replace("подтверждено ", ""))}` : ""}` : "Дата поступления не указана"}</span>
      </div>
    `;
  }
  const actual = formatDate(item.actualDate);
  const age = actualityAge(item.actualDate);
  if (!published && !actual) return "";
  return `
    <div class="object-dates" aria-label="Даты объявления">
      ${published ? `<span>Опубликовано: ${escapeHtml(published)}</span>` : ""}
      ${actual ? `<span class="object-actuality ${escapeHtml(age?.tone || "")}">Актуально на: ${escapeHtml(actual)}${age ? ` · ${escapeHtml(age.label)}` : ""}</span>` : ""}
    </div>
  `;
}

function specsHtml(item) {
  const specs = [item.roomsText, item.area, item.floor].filter(Boolean);
  if (!specs.length) return "";
  return `<div class="object-specs">${specs.map((spec) => `<span class="spec">${escapeHtml(spec)}</span>`).join("")}</div>`;
}

function detailRowHtml(label, value) {
  if (!normalize(value)) return "";
  return `<div class="detail-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function saleCharacteristicsHtml(item) {
  if (!isSaleDeal(item)) return "";

  const rows = [
    detailRowHtml("Год постройки", item.year),
    detailRowHtml("Состояние / ремонт", item.condition),
    detailRowHtml("Документы", item.documents),
    detailRowHtml("Площадь участка", item.landArea),
    detailRowHtml("Материал/серия дома", item.material),
  ].filter(Boolean);

  if (!rows.length) return "";
  return `
    <section class="object-description object-characteristics" aria-label="Характеристики">
      <h2>Характеристики</h2>
      <div class="detail-list">
        ${rows.join("")}
      </div>
    </section>
  `;
}

function sharingCharacteristicsHtml(item) {
  if (!item.isShared) return "";
  const rows = [
    detailRowHtml("Формат проживания", item.occupancyType),
    detailRowHtml("Кого рассматривают", item.preferredTenant),
    detailRowHtml("Уже проживает", item.currentResidents ? `${item.currentResidents} чел.` : ""),
    detailRowHtml("Заселение", item.moveInDate),
    detailRowHtml("Коммунальные", item.utilitiesIncluded),
    detailRowHtml("Депозит", item.deposit),
  ].filter(Boolean);
  return `
    <section class="object-description object-characteristics" aria-label="Условия подселения">
      <h2>Условия подселения</h2>
      <div class="detail-list">${rows.join("")}</div>
    </section>
  `;
}

function contactMessage(item) {
  const specs = [item.area, item.floor].filter(Boolean).join(", ");
  const messagePrice = normalize(item.price).replace(/^\$+/, "$");
  return [
    item.isRequest
      ? "Здравствуйте! Пишу по вашей заявке на сайте Liberterra:"
      : "Здравствуйте! Пишу по объекту с сайта Liberterra:",
    item.id ? `${item.isRequest ? "ID заявки" : "ID объекта"}: #${item.id}` : "",
    item.title,
    `Район: ${item.district}`,
    `Цена: ${messagePrice}${displayPer(item) ? ` ${displayPer(item)}` : ""}`,
    specs ? `Характеристики: ${specs}` : "",
  ].filter(Boolean).join("\n");
}

function contactName(item) {
  if (item.contactName) return item.contactName.startsWith("@") ? item.contactName.slice(1) : item.contactName;
  return item.phone ? "Владелец объявления" : "Liberterra";
}

function objectCountForContact(item) {
  const phone = phoneDigits(item.phone);
  if (!phone) return 0;
  return visibleObjects.filter((entry) => !entry.isRequest && phoneDigits(entry.phone) === phone).length;
}

function objectCountLabel(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11
    ? "объект"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "объекта"
      : "объектов";
  return `${count} ${word}`;
}

function contactCardHtml(item) {
  if (item.isRequest) {
    const applicantName = item.contactName || "Пользователь Liberterra";
    return `
      <section class="object-contact-card request-contact-card" aria-label="Контакты автора заявки">
        <div class="object-contact-icon" aria-hidden="true">${userSvg}</div>
        <div class="object-contact-copy">
          <span class="object-contact-role">Автор заявки</span>
          <strong data-object-contact-name>${escapeHtml(applicantName)}</strong>
          ${contactPhoneGateHtml(item)}
        </div>
      </section>
    `;
  }
  const count = objectCountForContact(item);
  const isAgentContact = Boolean(item.listingAgentName || item.listingAgentAgency || item.listingAgentPublicRef || count > 1);
  const isVerifiedAgent = item.listingAgentVerified === true || item.listingAgentVerified === "true" || item.listingAgentVerified === 1;
  const contactRole = isAgentContact ? "Агент" : item.phone || item.contactName ? "Собственник" : "Контакт по объекту";
  const displayContactName = item.listingAgentName || item.contactName || (isAgentContact ? "Агент по недвижимости" : item.phone ? "Собственник" : "Liberterra");
  const profileUrl = item.listingAgentPublicRef
    ? `/agent-public.html?agent=${encodeURIComponent(item.listingAgentPublicRef)}`
    : item.phone ? `/agent-public.html?phone=${encodeURIComponent(phoneDigits(item.phone))}` : "";
  const nameHtml = profileUrl
    ? `<a class="object-contact-name" data-object-contact-name href="${profileUrl}">${escapeHtml(displayContactName)}</a>`
    : `<strong data-object-contact-name>${escapeHtml(displayContactName)}</strong>`;
  return `
    <section class="object-contact-card" aria-label="Контакты владельца объявления">
      <div class="object-contact-icon" aria-hidden="true">${userSvg}</div>
      <div class="object-contact-copy">
        <span class="object-contact-role">${escapeHtml(contactRole)}</span>
        ${nameHtml}
        ${isAgentContact && isVerifiedAgent ? '<span class="object-contact-verified">✓ Проверенный агент Liberterra</span>' : ""}
        <span class="object-contact-agency" data-object-contact-agency${item.listingAgentAgency ? "" : " hidden"}>${item.listingAgentAgency ? `Компания: ${escapeHtml(item.listingAgentAgency)}` : ""}</span>
        ${contactPhoneGateHtml(item)}
        ${profileUrl ? `<a class="object-contact-count" href="${profileUrl}">Опубликовано: ${escapeHtml(objectCountLabel(count))} <i aria-hidden="true">→</i></a>` : ""}
      </div>
    </section>
  `;
}

function contactLink(item) {
  if (item.phone) {
    const digits = phoneDigits(item.phone);
    if (digits) return `https://wa.me/${digits}?text=${encodeURIComponent(contactMessage(item))}`;
  }
  return item.tgLink || BOT_LINK;
}

function contactPhoneGateHtml(item) {
  const digits = phoneDigits(item?.phone);
  if (digits && digits.length >= 9 && digits.length <= 15) {
    return `<a class="object-contact-phone" href="tel:+${escapeHtml(digits)}">${escapeHtml(formatPhone(item.phone))}</a>`;
  }
  if (item?.isRequest) return '<span class="object-contact-phone">Номер не опубликован</span>';
  if (!item?.id) return '<span class="object-contact-phone">Контакт уточняется</span>';
  const id = escapeHtml(item.id);
  return `<span class="object-contact-phone object-contact-preview" data-contact-phone="${id}" data-contact-preview="${id}"><span aria-hidden="true">☎</span> <span data-contact-preview-value>+996 ••• ••• •xx</span> <button type="button" data-contact-gate="${id}">Показать</button></span>`;
}

function contactGateActionsHtml(item) {
  const digits = phoneDigits(item?.phone);
  if (digits && digits.length >= 9 && digits.length <= 15) {
    const message = encodeURIComponent(contactMessage(item));
    return `<span class="listing-contact-actions"><a class="card-action primary" href="tel:+${escapeHtml(digits)}">Позвонить</a><a class="card-action secondary" href="https://wa.me/${escapeHtml(digits)}?text=${message}" target="_blank" rel="noopener noreferrer">WhatsApp</a></span>`;
  }
  if (item?.isRequest) return '<span class="contact-gate-note">Контакт не опубликован</span>';
  if (!item?.id) return '<span class="contact-gate-note">Контакт уточняется</span>';
  const id = escapeHtml(item.id);
  const message = escapeHtml(contactMessage(item));
  return `<span class="listing-contact-actions" data-contact-gate-wrap="${id}"><button class="card-action primary" type="button" data-contact-gate="${id}" data-contact-call="${id}">Позвонить</button><button class="card-action secondary" type="button" data-contact-gate="${id}" data-contact-whatsapp="${id}" data-contact-message="${message}">WhatsApp</button></span>`;
}

function isSaleDeal(item) {
  return normalize(item?.deal).toLowerCase() === "продажа";
}

function callLink(item) {
  if (item.phone) {
    const digits = phoneDigits(item.phone);
    if (digits) return `tel:+${digits}`;
  }
  return isSaleDeal(item) ? SALE_PHONE_TEL : RENT_PHONE_TEL;
}

function publicObjectUrl(item) {
  return item?.id ? new URL(`/object?id=${encodeURIComponent(item.id)}`, window.location.origin).href : "";
}

function shareText(item) {
  const botObjectLink = item?.id
    ? `https://t.me/Liberterra_kg_bot?start=object_${encodeURIComponent(item.id)}`
    : "https://t.me/Liberterra_kg_bot";
  return [
    item.listingAgentName || "",
    item.listingAgentAgency ? `Компания: ${item.listingAgentAgency}` : "",
    `Посмотрите объект на Liberterra: ${item.title}`,
    publicObjectUrl(item),
    `Написать по объекту в Telegram-бот: ${botObjectLink}`,
    "Подпишитесь на нашу группу недвижимости: https://t.me/NedvizhimostKGZ",
  ].filter(Boolean).join("\n\n");
}

function applyListingAgent(agent) {
  if (!currentObject || currentObject.isRequest || !agent) return;
  currentObject.listingAgentName = normalize(agent.name);
  currentObject.listingAgentAgency = normalize(agent.agency);
  currentObject.listingAgentPublicRef = normalize(agent.publicRef || agent.public_ref);
  window.LiberterraAgentPhoto?.show(document.querySelector(".object-contact-icon"), agent.avatar_url, agent.name);

  const name = document.querySelector("[data-object-contact-name]");
  if (name && currentObject.listingAgentName) {
    name.textContent = currentObject.listingAgentName;
    if (name.matches("a") && currentObject.listingAgentPublicRef) {
      name.href = `/agent-public.html?agent=${encodeURIComponent(currentObject.listingAgentPublicRef)}`;
    }
  }

  const agency = document.querySelector("[data-object-contact-agency]");
  if (agency) {
    agency.textContent = currentObject.listingAgentAgency
      ? `Компания: ${currentObject.listingAgentAgency}`
      : "";
    agency.hidden = !currentObject.listingAgentAgency;
  }
  const role = document.querySelector(".object-contact-role");
  if (role && currentObject.listingAgentName) role.textContent = "Агент";
}

window.addEventListener("liberterra:listing-agent-loaded", (event) => {
  applyListingAgent(event.detail?.agent);
});

async function shareCurrentObject(button) {
  if (!publicObjectUrl(currentObject)) return;

  if (navigator.share) {
    try {
      await navigator.share({ title: currentObject.title, text: `${currentObject.price}. ${currentObject.district}`, url: publicObjectUrl(currentObject) });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(shareText(currentObject));
    const originalMarkup = button.innerHTML;
    if (button.closest(".object-mobile-actions")) button.innerHTML = '<span aria-hidden="true">✓</span><small>Скопировано</small>';
    else button.textContent = "Скопировано";
    button.classList.add("is-copied");
    window.setTimeout(() => {
      button.innerHTML = originalMarkup;
      button.classList.remove("is-copied");
    }, 1800);
  } catch {
    window.prompt("Скопируйте текст для отправки", shareText(currentObject));
  }
}

function favoriteObjectIds() {
  try { return new Set(JSON.parse(localStorage.getItem("liberterra_favorite_objects_v1") || "[]").map(String)); }
  catch (_) { return new Set(); }
}

function updateGalleryFavoriteButton() {
  const buttons = document.querySelectorAll("[data-gallery-favorite]");
  if (!buttons.length || !currentObject) return;
  const active = favoriteObjectIds().has(String(currentObject.id));
  buttons.forEach((button) => {
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", active ? "Убрать из избранного" : "Добавить в избранное");
    if (button.matches("[data-mobile-favorite]")) {
      button.innerHTML = `<span aria-hidden="true">${active ? "♥" : "♡"}</span><small>${active ? "Сохранено" : "Избранное"}</small>`;
    } else {
      button.textContent = active ? "♥" : "♡";
    }
  });
}

async function toggleGalleryFavorite() {
  if (!currentObject) return;
  const ids = favoriteObjectIds();
  const id = String(currentObject.id);
  const enabled = !ids.has(id);
  enabled ? ids.add(id) : ids.delete(id);
  localStorage.setItem("liberterra_favorite_objects_v1", JSON.stringify([...ids]));
  updateGalleryFavoriteButton();
  if (window.LiberterraAgentAccess?.hasUserSession()) {
    window.LiberterraAgentAccess.request("set_user_favorite", { object_id: id, enabled }).catch(() => {});
  }
}

function displayPhone(item) {
  if (item.phone) return formatPhone(item.phone);
  return isSaleDeal(item) ? SALE_PHONE_DISPLAY : RENT_PHONE_DISPLAY;
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

function displayPer(item) {
  return isSaleDeal(item) ? "" : normalize(item?.per);
}

function priceHtml(item) {
  if (window.LiberterraListingFormat.hasConflictingCurrency(item.price)) return `<span class="price-unconfirmed">Цена уточняется</span>`;
  const per = displayPer(item);
  return `<span class="price-with-conversion" data-fx-price="${escapeHtml(item.price)}" data-fx-per="${escapeHtml(per)}">${escapeHtml(item.price)}${per ? ` <small>${escapeHtml(per)}</small>` : ""}</span>`;
}

function pricePerSquareMeterHtml(item) {
  if (item.isRequest || !isSaleDeal(item) || /м[²2]/i.test(normalize(item.per))) return "";
  const areaMatch = normalize(item.area).replace(/[\u00a0\u202f]/g, " ").match(/^(\d+(?:[.,]\d+)?)\s*м[²2]$/i);
  const price = normalize(item.price).replace(/[\u00a0\u202f]/g, " ");
  const usdMatch = price.match(/^\$\s*(\d+(?:\s\d{3})*(?:[.,]\d{1,2})?)$/);
  const kgsMatch = price.match(/^(\d+(?:\s\d{3})*(?:[.,]\d{1,2})?)\s*сом$/i);
  if (!areaMatch || (!usdMatch && !kgsMatch)) return "";
  const area = Number(areaMatch[1].replace(",", "."));
  const amount = Number((usdMatch || kgsMatch)[1].replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(area) || area <= 0 || !Number.isFinite(amount) || amount <= 0) return "";
  const unitPrice = Math.round(amount / area);
  if (unitPrice <= 0) return "";
  const label = `${usdMatch ? "$" : ""}${new Intl.NumberFormat("ru-RU").format(unitPrice)}${kgsMatch ? " сом" : ""} / м²`;
  return `<span class="object-unit-price">${escapeHtml(label)}</span>`;
}

function formatValuationMoney(value, currency) {
  if (!Number.isFinite(value)) return "";
  const formatted = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
  return currency === "USD" ? `${formatted}` : `${formatted} сом`;
}

function marketValuationHtml(item) {
  const model = window.LiberterraMarketValuation;
  if (!model?.estimate || item.isRequest) return "";
  const valuation = model.estimate(item, visibleObjects);
  if (!valuation.available) {
    return `
      <section class="market-valuation is-pending" aria-label="AI-оценка рыночной стоимости">
        <div class="market-valuation-heading">
          <span class="market-valuation-icon" aria-hidden="true">AI</span>
          <div><small>Оценка Liberterra</small><h2>Рыночная стоимость</h2></div>
        </div>
        <p>${escapeHtml(valuation.reason)}</p>
        <small class="market-valuation-note">Оценка появится автоматически, когда в каталоге будет достаточно актуальных аналогов.</small>
      </section>
    `;
  }

  const delta = Math.abs(valuation.deltaPercent);
  const positionClass = valuation.position === "Выше рынка" ? "is-high" : valuation.position === "Ниже рынка" ? "is-low" : "is-market";
  const positionDetail = valuation.position === "В пределах рынка"
    ? "Цена объявления близка к расчётному ориентиру"
    : `${delta}% ${valuation.deltaPercent > 0 ? "выше" : "ниже"} расчётного ориентира`;
  return `
    <section class="market-valuation" aria-label="AI-оценка рыночной стоимости">
      <div class="market-valuation-heading">
        <span class="market-valuation-icon" aria-hidden="true">AI</span>
        <div><small>Оценка Liberterra</small><h2>Рыночная стоимость</h2></div>
      </div>
      <strong class="market-valuation-range">${formatValuationMoney(valuation.low, valuation.currency)}–${formatValuationMoney(valuation.high, valuation.currency)}</strong>
      <div class="market-valuation-position ${positionClass}"><b>${escapeHtml(valuation.position)}</b><span>${escapeHtml(positionDetail)}</span></div>
      <dl>
        <div><dt>Аналоги</dt><dd>${valuation.comparableCount}</dd></div>
        <div><dt>Уверенность</dt><dd>${escapeHtml(valuation.confidence)}</dd></div>
      </dl>
      <small class="market-valuation-note">Автоматический ориентир по похожим активным объявлениям Liberterra, а не официальная оценка. Состояние, документы и торг могут изменить итоговую цену.</small>
    </section>
  `;
}

function setMeta(name, value) {
  const selector = name.startsWith("og:")
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
  const tag = document.querySelector(selector);
  if (tag) tag.setAttribute("content", value);
}

function updatePageMeta(item) {
  const title = `${item.title} — Liberterra`;
  const description = `${item.price}${displayPer(item) ? ` ${displayPer(item)}` : ""}. ${item.district}. ${item.area || "Площадь уточняется"}.`;
  const objectUrl = `${window.location.origin}/object?id=${encodeURIComponent(item.id)}`;
  document.title = title;
  setMeta("description", description);
  setMeta("og:title", title);
  setMeta("og:description", description);
  setMeta("og:url", objectUrl);
  const canonical = document.querySelector("#objectCanonical");
  if (canonical) canonical.setAttribute("href", objectUrl);
  if (item.photoUrls[0]) setMeta("og:image", item.photoUrls[0]);
}

function galleryHtml(item) {
  if (!item.photoUrls.length) {
    return `
      <div class="object-gallery">
        <div class="object-photo-placeholder" role="img" aria-label="Фото объекта скоро появится">
          <div class="placeholder-pin">${pinSvg}</div>
        </div>
      </div>
    `;
  }

  const thumbs = item.photoUrls.map((url, index) => `
    <button class="object-thumb${index === 0 ? " is-active" : ""}" type="button" data-object-photo="${index}" aria-label="Показать фото ${index + 1}">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(item.title)} — фото ${index + 1}" loading="lazy">
    </button>
  `).join("");

  const dots = item.photoUrls.map((_, index) => `
    <button class="object-gallery-dot${index === 0 ? " is-active" : ""}" type="button" data-object-photo="${index}" aria-label="Фото ${index + 1}"></button>
  `).join("");

  return `
    <div class="object-gallery">
      <div class="object-main-photo-wrap">
      <img class="object-main-photo" id="objectMainPhoto" src="${escapeHtml(item.photoUrls[0])}" alt="${escapeHtml(item.title)}" loading="eager" decoding="async" fetchpriority="high" role="button" tabindex="0" aria-label="Открыть фотографии на весь экран">
        <div class="object-gallery-tools">
          <span class="object-photo-counter" data-photo-counter>1 / ${item.photoUrls.length}</span>
          <button type="button" data-gallery-favorite aria-label="Добавить в избранное" aria-pressed="false">♡</button>
          <button type="button" data-gallery-share aria-label="Поделиться объектом">↗</button>
          <button type="button" data-gallery-fullscreen aria-label="Открыть фотографии на весь экран">⛶</button>
        </div>
        ${item.photoUrls.length > 1 ? `
          <button class="object-gallery-arrow prev" type="button" data-object-step="-1" aria-label="Предыдущее фото">‹</button>
          <button class="object-gallery-arrow next" type="button" data-object-step="1" aria-label="Следующее фото">›</button>
        ` : ""}
        ${item.photoUrls.length > 1 ? `<div class="object-gallery-dots" aria-label="Фото объекта">${dots}</div>` : ""}
      </div>
      ${item.photoUrls.length > 1 ? `<div class="object-thumbs">${thumbs}</div>` : ""}
    </div>
    <div class="object-lightbox" data-object-lightbox hidden role="dialog" aria-modal="true" aria-label="Фотографии объекта">
      <button class="object-lightbox-close" type="button" data-lightbox-close aria-label="Закрыть">×</button>
      <button class="object-lightbox-arrow prev" type="button" data-object-step="-1" aria-label="Предыдущее фото">‹</button>
      <img data-lightbox-photo src="${escapeHtml(item.photoUrls[0])}" alt="${escapeHtml(item.title)} — фото 1">
      <button class="object-lightbox-arrow next" type="button" data-object-step="1" aria-label="Следующее фото">›</button>
      <span data-lightbox-counter>1 / ${item.photoUrls.length}</span>
    </div>
  `;
}

function relatedObjectsHtml(item) {
  const requestedDeal = item.isRequest
    ? item.requestDeal === "buy" ? "продажа" : "аренда"
    : "";
  const candidates = visibleObjects
    .filter((entry) => entry.id !== item.id && !entry.isRequest)
    .filter((entry) => !item.isRequest || normalize(entry.deal).toLowerCase() === requestedDeal)
    .filter((entry) => !item.isRequest || normalize(entry.segment).toLowerCase() === normalize(item.segment).toLowerCase())
    .map((entry) => {
      let score = 0;
      if (normalize(entry.deal).toLowerCase() === (item.isRequest ? requestedDeal : normalize(item.deal).toLowerCase())) score += 5;
      if (normalize(entry.segment).toLowerCase() === normalize(item.segment).toLowerCase()) score += 4;
      if (normalize(entry.district).toLowerCase() === normalize(item.district).toLowerCase()) score += 3;
      if (entry.rooms && item.rooms && normalize(entry.rooms) === normalize(item.rooms)) score += 2;
      return { entry, score };
    })
    .filter(({ score }) => score >= 5)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ entry }) => entry);

  if (!candidates.length) {
    const deal = item.isRequest ? requestedDeal : normalize(item.deal).toLowerCase();
    const catalogUrl = deal ? `/catalog.html?deal=${encodeURIComponent(deal)}` : "/catalog.html";
    return `
      <section class="object-related object-related-empty" aria-labelledby="relatedObjectsTitle">
        <div class="object-related-heading"><div><span>Продолжить поиск</span><h2 id="relatedObjectsTitle">Посмотреть другие объекты</h2></div></div>
        <p>В этой подборке пока нет близких вариантов. Можно посмотреть все актуальные предложения.</p>
        <a href="${catalogUrl}">Открыть каталог →</a>
      </section>
    `;
  }
  const cards = candidates.map((entry) => `
    <a class="related-object-card" href="/object?id=${encodeURIComponent(entry.id)}">
      ${entry.photoUrls[0] ? `<img src="${escapeHtml(entry.photoUrls[0])}" alt="${escapeHtml(entry.title)}" loading="lazy">` : '<span class="related-object-photo-placeholder">Фото готовится</span>'}
      <span class="related-object-copy">
        <strong>${escapeHtml(entry.price)}${displayPer(entry) ? ` <small>${escapeHtml(displayPer(entry))}</small>` : ""}</strong>
        <b>${escapeHtml(entry.title)}</b>
        <small>${escapeHtml(entry.district)}</small>
      </span>
    </a>
  `).join("");
  const heading = item.isRequest
    ? item.requestDeal === "buy" ? "Варианты для покупки" : "Варианты в аренду"
    : "Похожие объекты";
  const eyebrow = item.isRequest ? "Предложения по заявке" : "Ещё варианты";
  return `
    <section class="object-related" aria-labelledby="relatedObjectsTitle">
      <div class="object-related-heading"><div><span>${eyebrow}</span><h2 id="relatedObjectsTitle">${heading}</h2></div><a href="/miniapp.html">Весь каталог →</a></div>
      <div class="object-related-grid">${cards}</div>
    </section>
  `;
}

function objectHtml(item) {
  return `
    <article class="object-detail">
      <div class="object-gallery-column">
        ${galleryHtml(item)}
        <div class="object-viewing-slot" data-viewing-request></div>
      </div>
      <div class="object-info">
        <div class="object-tags">
          ${item.isShared ? `<span class="badge">Подселение</span>` : ""}
          ${window.LiberterraAgentAccess?.contractVerifiedBadgeHtml(item) || ""}
          <span class="deal-tag${item.isRequest ? " request-tag" : ""}">${escapeHtml(item.dealLabel)}</span>
          <span class="segment-tag">${escapeHtml(item.segment)}</span>
        </div>
        <div class="object-price">${priceHtml(item)}${pricePerSquareMeterHtml(item)}</div>
        ${window.LiberterraAgentAccess?.commissionBadgeHtml(item, "object") || ""}
        <h1>${escapeHtml(item.title)}</h1>
        <div class="object-location">${pinSvg}<span>${escapeHtml(item.district)}</span></div>
        ${specsHtml(item)}
        ${objectDatesHtml(item)}
        <div class="object-listing-agent" data-object-listing-agent aria-live="polite"></div>
        ${marketValuationHtml(item)}
        ${item.description ? `
          <section class="object-description${item.description.length > 360 ? " is-collapsible is-collapsed" : ""}" aria-label="Описание">
            <h2>Описание</h2>
            <p>${escapeHtml(item.description)}</p>
            ${item.description.length > 360 ? '<button type="button" data-description-toggle aria-expanded="false">Показать полностью ↓</button>' : ""}
          </section>
        ` : ""}
        ${saleCharacteristicsHtml(item)}
        ${sharingCharacteristicsHtml(item)}
        ${contactCardHtml(item)}
        <div class="object-actions">
          ${contactGateActionsHtml(item)}
          <button class="object-share-action" type="button" data-share-current-object aria-label="Поделиться объектом">↗ <span>Поделиться</span></button>
        </div>
      </div>
    </article>
    ${relatedObjectsHtml(item)}
    <nav class="object-mobile-actions" aria-label="Связаться по объявлению">
      ${item.id ? `<button class="is-primary" type="button" data-contact-gate="${escapeHtml(item.id)}" data-contact-call="${escapeHtml(item.id)}"><span aria-hidden="true">☎</span><small>Позвонить</small></button><button class="is-secondary" type="button" data-contact-gate="${escapeHtml(item.id)}" data-contact-whatsapp="${escapeHtml(item.id)}" data-contact-message="${escapeHtml(contactMessage(item))}"><small>WhatsApp</small></button>` : ""}
    </nav>
    <div data-agent-object-workspace></div>
  `;
}

function stateHtml(title, text) {
  return `
    <div class="object-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
      <a class="header-action" href="/">Вернуться в каталог</a>
    </div>
  `;
}

function setActivePhoto(index) {
  if (!currentObject?.photoUrls?.length) return;
  activePhotoIndex = (index + currentObject.photoUrls.length) % currentObject.photoUrls.length;
  const image = document.querySelector("#objectMainPhoto");
  const url = currentObject.photoUrls[activePhotoIndex];
  if (image && url) {
    image.src = url;
    image.alt = `${currentObject.title} — фото ${activePhotoIndex + 1}`;
  }
  document.querySelectorAll("[data-object-photo]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.objectPhoto) === activePhotoIndex);
  });
  document.querySelectorAll("[data-photo-counter], [data-lightbox-counter]").forEach((node) => {
    node.textContent = `${activePhotoIndex + 1} / ${currentObject.photoUrls.length}`;
  });
  const lightboxPhoto = document.querySelector("[data-lightbox-photo]");
  if (lightboxPhoto && url) {
    lightboxPhoto.src = url;
    lightboxPhoto.alt = `${currentObject.title} — фото ${activePhotoIndex + 1}`;
  }
  if (currentObject.photoUrls.length > 1) {
    [-1, 1].forEach((step) => {
      const adjacent = currentObject.photoUrls[(activePhotoIndex + step + currentObject.photoUrls.length) % currentObject.photoUrls.length];
      if (adjacent) new Image().src = adjacent;
    });
  }
}

function setLightboxOpen(open) {
  const lightbox = document.querySelector("[data-object-lightbox]");
  if (!lightbox) return;
  lightbox.hidden = !open;
  document.body.classList.toggle("object-lightbox-open", open);
  if (open) lightbox.querySelector("[data-lightbox-close]")?.focus();
}

function renderObject(item) {
  currentObject = item;
  activePhotoIndex = 0;
  objectPage.dataset.recordKind = item.isRequest ? "request" : "object";
  updatePageMeta(item);
  objectPage.innerHTML = objectHtml(item);
  objectPage.dispatchEvent(new CustomEvent("liberterra:contact-preview", { bubbles: true }));
  window.LiberterraViewing?.mount(objectPage, item);
  updateGalleryFavoriteButton();
  window.dispatchEvent(new CustomEvent("liberterra:object-rendered", {
    detail: { objectId: item.id, isRequest: Boolean(item.isRequest) },
  }));
}

function setObjects(rows, showMissing = true) {
  const id = getObjectId();
  if (!id) {
    objectPage.innerHTML = stateHtml("Объект не найден", "В ссылке нет идентификатора объекта.");
    return false;
  }

  const items = latestObjectVersions(rows
    .map(normalizeRow)
    .filter((item) => normalize(item.city).toLowerCase() === "бишкек")
    .filter((item) => ["аренда", "продажа", "запрос"].includes(normalize(item.deal).toLowerCase()))
    .filter((item) => ["опубликован", "active", "published"].includes(normalize(item.status).toLowerCase())));

  visibleObjects = items;

  const item = items.find((entry) => entry.id === id);
  if (!item) {
    if (showMissing) {
      objectPage.innerHTML = stateHtml("Объект не найден", "Он мог быть снят с публикации или ссылка устарела.");
    }
    return false;
  }

  renderObject(item);
  return true;
}

function showError(message, retryable = false) {
  objectPage.innerHTML = stateHtml("Не удалось загрузить объект", message || "Попробуйте открыть каталог позже.");
  if (retryable) {
    const state = objectPage.querySelector(".object-state");
    const backLink = state?.querySelector("a");
    if (!state || !backLink) return;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "object-retry header-action";
    retry.dataset.retryObjectLoad = "true";
    retry.textContent = "Повторить загрузку";
    state.insertBefore(retry, backLink);
  }
}

function freshCatalogCsvUrl() {
  const url = new URL(SHEET_CSV_URL, window.location.href);
  url.searchParams.set("catalog_fresh", String(Date.now()));
  return url.toString();
}

let catalogFetchPromise = null;
let lastCatalogCheckAt = 0;
// The Worker may spend up to 15 seconds refreshing the source spreadsheet.
// Keep the browser deadline slightly above that upstream limit.
const CATALOG_REQUEST_TIMEOUT_MS = 18000;

async function loadObjectsWithFetch() {
  if (catalogFetchPromise) return catalogFetchPromise;
  lastCatalogCheckAt = Date.now();
  catalogFetchPromise = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CATALOG_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(freshCatalogCsvUrl(), {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      const text = await response.text();
      const rows = parseCsv(text);
      setObjects(rows);
      document.documentElement.dataset.objectRefreshedMs = String(Math.round(performance.now()));
    } catch (error) {
      if (!visibleObjects.length) {
        const message = error?.name === "AbortError"
          ? "Каталог загружается дольше обычного. Попробуйте ещё раз."
          : error?.status >= 500
            ? "Каталог временно недоступен. Попробуйте загрузить объект ещё раз."
            : (error.message || "Не удалось связаться с каталогом. Проверьте интернет и повторите попытку.");
        showError(message, true);
      }
    } finally {
      window.clearTimeout(timeout);
    }
  })();
  try {
    return await catalogFetchPromise;
  } finally {
    catalogFetchPromise = null;
  }
}

function revalidateVisibleObject() {
  if (document.hidden || Date.now() - lastCatalogCheckAt < 2000) return;
  loadObjectsWithFetch();
}

function loadObject() {
  objectPage.innerHTML = stateHtml("Загружаем объект", "Проверяем актуальный статус публикации.");

  if (!SHEET_CSV_URL) {
    if (!visibleObjects.length) showError("CSV-ссылка Google Sheets не указана.");
    return;
  }

  loadObjectsWithFetch();
}

objectPage?.addEventListener("click", (event) => {
  if (event.target.closest("[data-retry-object-load]")) {
    loadObject();
    return;
  }
  if (event.target.closest("[data-gallery-favorite]")) {
    toggleGalleryFavorite();
    return;
  }
  if (event.target.closest("[data-gallery-share]")) {
    shareCurrentObject(event.target.closest("[data-gallery-share]"));
    return;
  }
  if (event.target.closest("[data-gallery-fullscreen]")) {
    setLightboxOpen(true);
    return;
  }
  if (event.target.closest("#objectMainPhoto")) {
    if (!suppressPhotoClick) setLightboxOpen(true);
    suppressPhotoClick = false;
    return;
  }
  if (event.target.closest("[data-lightbox-close]") || (event.target.matches("[data-object-lightbox]"))) {
    setLightboxOpen(false);
    return;
  }
  const shareButton = event.target.closest("[data-share-current-object]");
  if (shareButton) {
    shareCurrentObject(shareButton);
    return;
  }

  const descriptionButton = event.target.closest("[data-description-toggle]");
  if (descriptionButton) {
    const description = descriptionButton.closest(".object-description");
    const collapsed = description.classList.toggle("is-collapsed");
    descriptionButton.textContent = collapsed ? "Показать полностью ↓" : "Скрыть ↑";
    descriptionButton.setAttribute("aria-expanded", String(!collapsed));
    return;
  }

  const photoButton = event.target.closest("[data-object-photo]");
  if (photoButton) {
    setActivePhoto(Number(photoButton.dataset.objectPhoto));
    return;
  }

  const stepButton = event.target.closest("[data-object-step]");
  if (stepButton) {
    setActivePhoto(activePhotoIndex + Number(stepButton.dataset.objectStep));
  }
});

let swipeStartX = 0;
let swipeStartY = 0;
let suppressPhotoClick = false;

objectPage?.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".object-main-photo-wrap, [data-object-lightbox] img")) return;
  swipeStartX = event.clientX;
  swipeStartY = event.clientY;
});

objectPage?.addEventListener("pointerup", (event) => {
  if (!currentObject?.photoUrls || currentObject.photoUrls.length < 2) return;
  if (!event.target.closest(".object-main-photo-wrap, [data-object-lightbox] img")) return;

  const diffX = event.clientX - swipeStartX;
  const diffY = event.clientY - swipeStartY;
  if (Math.abs(diffX) < 44 || Math.abs(diffX) < Math.abs(diffY) * 1.2) return;

  suppressPhotoClick = Boolean(event.target.closest(".object-main-photo-wrap"));
  setActivePhoto(activePhotoIndex + (diffX < 0 ? 1 : -1));
});

document.addEventListener("keydown", (event) => {
  if (!currentObject?.photoUrls?.length) return;
  if ((event.key === "Enter" || event.key === " ") && event.target?.matches?.("#objectMainPhoto")) {
    event.preventDefault();
    setLightboxOpen(true);
    return;
  }
  if (event.key === "Escape") setLightboxOpen(false);
  if (event.key === "ArrowLeft") setActivePhoto(activePhotoIndex - 1);
  if (event.key === "ArrowRight") setActivePhoto(activePhotoIndex + 1);
});

window.addEventListener("liberterra:agent-role", () => {
  if (currentObject) renderObject(currentObject);
});

loadObject();

// Telegram and mobile browsers may restore an already-open detail page from
// memory. Recheck the source when the user returns so a deleted or archived
// listing cannot remain visible from a stale page snapshot.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) revalidateVisibleObject();
});
window.addEventListener("focus", revalidateVisibleObject);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) revalidateVisibleObject();
});
