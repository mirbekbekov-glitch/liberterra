(() => {
  "use strict";
  const slot = document.querySelector("#myListings");
  let loading = false;
  let loaded = false;
  let currentObjects = [];
  let filter = "all";
  const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";
  const TG_MANUAL = "Пост в Telegram-канале удалите вручную — система его не отслеживает.";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const text = (value) => String(value ?? "").trim();
  const statusLabel = (value) => ({ "опубликован": "Опубликовано", "на модерации": "На проверке", "снят": "Архивировано", "снято": "Архивировано", "архив": "Архивировано", "archive": "Архивировано" }[String(value || "").toLowerCase()] || value || "На проверке");
  const isRemoved = (value) => ["снят", "снято", "removed", "архив", "archive", "неактуален"].includes(String(value || "").trim().toLowerCase());
  const isPublished = (value) => String(value || "").trim().toLowerCase() === "опубликован";

  const normalizePhoto = (value) => {
    const source = text(value);
    if (!source) return "";
    const filename = source.split(/[?#]/, 1)[0].split("/").pop();
    return /^object_[^/]+\.(?:jpe?g|png|webp)$/i.test(filename || "")
      ? `${PHOTO_DELIVERY_ORIGIN}/uploads/${encodeURIComponent(filename)}`
      : source;
  };
  const photoList = (value) => String(value || "").split(/\s*(?:\||\n)\s*/).map((url) => url.trim()).filter(Boolean);
  const firstPhoto = (value) => normalizePhoto(photoList(value)[0] || "");
  const catalogPhoto = (id) => {
    const row = (window.LIBERTERRA_LOCAL_OBJECTS || []).find((item) => String(item.id) === String(id));
    return firstPhoto(row?.photo_url);
  };
  const photoFor = (item) => firstPhoto(item.photo_url) || catalogPhoto(item.id);
  const hasPhoto = (item) => Boolean(photoFor(item));

  // Название собирается из данных. Идентификатор названием не бывает.
  const buildTitle = (item) => {
    const rooms = text(item.rooms);
    let kind = text(item.title).replace(/^\d+\s*-?\s*комн\.?,?\s*/i, "").replace(/^Объект\s*№.*$/i, "").trim();
    const head = [];
    if (/^\d{1,2}$/.test(rooms)) head.push(`${rooms}-комн.`);
    if (kind) head.push(head.length ? kind.toLowerCase() : kind);
    if (!head.length) return "Черновик без названия";
    let title = head.join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);
    const tail = [];
    if (text(item.district)) tail.push(text(item.district));
    if (text(item.area)) tail.push(`${text(item.area)} м²`);
    return tail.length ? `${title} · ${tail.join(" · ")}` : title;
  };

  const priceText = (item) => {
    const price = text(item.price);
    if (!price || /^0+(\s|$)/.test(price)) return "";
    const per = text(item.per);
    return per ? `${price} ${per}` : price;
  };

  // Один список недостающего вместо шкалы, чипа и трёх разных подписей.
  const missingFields = (item) => {
    const missing = [];
    if (!text(item.district)) missing.push("район");
    if (!text(item.area)) missing.push("площадь");
    if (!priceText(item)) missing.push("цена");
    if (!hasPhoto(item)) missing.push("фото");
    return missing;
  };

  const statusGroup = (item) => {
    if (isRemoved(item.status)) return "archived";
    if (isPublished(item.status)) return "published";
    return "review";
  };
  const countsByGroup = (list) => {
    const counts = { all: list.length, published: 0, review: 0, archived: 0 };
    list.forEach((item) => { counts[statusGroup(item)] += 1; });
    return counts;
  };

  const showNotice = (message) => {
    document.querySelector(".cabinet-notice")?.remove();
    const notice = document.createElement("div");
    notice.className = "cabinet-notice";
    notice.setAttribute("role", "status");
    notice.textContent = message;
    document.body.append(notice);
    window.setTimeout(() => notice.remove(), 6000);
  };

  const objectUrl = (id) => {
    const currentLaunch = `${window.location.search}${window.location.hash}`;
    if (/[?&#]tgWebApp(?:Data|Version|Platform)=/i.test(currentLaunch)) sessionStorage.setItem("liberterra_telegram_launch", currentLaunch);
    const telegramLaunch = /[?&#]tgWebApp(?:Data|Version|Platform)=/i.test(currentLaunch)
      ? currentLaunch
      : sessionStorage.getItem("liberterra_telegram_launch") || "";
    const suffix = /[?&#]tgWebApp(?:Version|Platform)=/i.test(telegramLaunch) ? telegramLaunch : "";
    const launchSuffix = suffix.startsWith("?") ? `&${suffix.slice(1)}` : suffix;
    return `/object.html?id=${encodeURIComponent(id)}&source=my-listings${launchSuffix}`;
  };

  function injectStyle() {
    if (document.querySelector("#mlv3-style")) return;
    const style = document.createElement("style");
    style.id = "mlv3-style";
    style.textContent = `
.my-listings-v2-page #myListings.grid{display:flex;flex-direction:column;gap:10px}
.mlv3-filters{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 16px}
.mlv3-filters button{min-height:36px;padding:6px 14px;border:1px solid var(--v20-line,#ECE3E2);border-radius:999px;background:var(--v20-surface,#fff);color:var(--v20-muted,#6B6560);font:600 13px/1.2 inherit;cursor:pointer}
.mlv3-filters button b{color:var(--v20-text,#252a31)}
.mlv3-filters button[aria-pressed="true"]{background:var(--v20-accent,#BE2C28);border-color:var(--v20-accent,#BE2C28);color:#fff}
.mlv3-filters button[aria-pressed="true"] b{color:#fff}
.my-listings-v2-page #myListings .card.mlv3-row{flex-direction:row;align-items:center;gap:14px;padding:13px;overflow:visible}
.my-listings-v2-page #myListings .card.mlv3-row .mlv3-thumb{flex:0 0 auto;display:block;width:104px;height:78px;border-radius:10px;overflow:hidden;background:var(--v20-surface-2,#EEE8E1);aspect-ratio:auto}
.mlv3-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.mlv3-nophoto{display:grid;place-items:center;width:100%;height:100%;padding:4px;color:var(--v20-muted,#6B6560);font-size:11.5px;font-weight:600;text-align:center}
.mlv3-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.mlv3-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.my-listings-v2-page #myListings .mlv3-row .card-status{margin:0}
.mlv3-deal{color:var(--v20-muted,#6B6560);font-size:12.5px}
.my-listings-v2-page #myListings .mlv3-row h2{font-size:16px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mlv3-row h2 a{color:inherit;text-decoration:none}
.mlv3-row h2 a:hover{text-decoration:underline}
.my-listings-v2-page #myListings .mlv3-row .mlv3-price{margin:2px 0 0;font-size:15.5px;font-weight:700}
.my-listings-v2-page #myListings .mlv3-row .mlv3-price.is-empty{font-size:13.5px;font-weight:600;color:var(--v20-muted,#6B6560)}
.mlv3-missing{margin:2px 0 0;font-size:12.5px;color:#9A6412}
.mlv3-act{flex:0 0 auto;display:flex;align-items:center;gap:7px;position:relative}
.my-listings-v2-page #myListings .mlv3-row .mlv3-open{width:auto;min-height:40px;padding:8px 15px;font-size:13px}
.mlv3-more{min-height:40px;min-width:42px;padding:8px 11px;border:1px solid var(--v20-line,#ECE3E2);border-radius:9px;background:var(--v20-surface,#fff);color:var(--v20-muted,#6B6560);font:700 15px/1 inherit;cursor:pointer}
.mlv3-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:30;min-width:252px;padding:5px;border:1px solid var(--v20-line,#ECE3E2);border-radius:12px;background:var(--v20-surface,#fff);box-shadow:0 10px 34px rgb(0 0 0 / 14%)}
.mlv3-menu[hidden]{display:none}
.my-listings-v2-page #myListings .mlv3-menu a,.my-listings-v2-page #myListings .mlv3-menu button{display:block;width:100%;min-height:auto;margin:0;padding:10px 11px;border:0;border-radius:8px;background:transparent;color:var(--v20-text,#252a31);font:500 13.5px/1.3 inherit;text-align:left;text-decoration:none;cursor:pointer}
.my-listings-v2-page #myListings .mlv3-menu a:hover,.my-listings-v2-page #myListings .mlv3-menu button:hover{background:var(--v20-accent-soft,#FBEEED)}
.mlv3-menu hr{margin:5px 0;border:0;border-top:1px solid var(--v20-line,#ECE3E2)}
.mlv3-dialog{width:min(430px,100% - 32px);padding:0;border:0;border-radius:14px;background:var(--v20-surface,#fff);color:var(--v20-text,#252a31);box-shadow:0 14px 50px rgb(0 0 0 / 28%)}
.mlv3-dialog::backdrop{background:rgb(0 0 0 / 45%)}
.mlv3-dialog form{padding:19px}
.mlv3-dialog h3{margin:0 0 7px;font:700 17px/1.3 inherit}
.mlv3-dialog p{margin:0 0 13px;color:var(--v20-muted,#6B6560);font-size:13.5px}
.mlv3-tg{margin:0 0 16px;padding:10px 12px;border:1px solid var(--v20-line,#ECE3E2);border-left:3px solid #9A6412;border-radius:9px;background:#FBF1DF;color:#5A3D0B;font-size:12.5px}
.mlv3-dialog menu{display:flex;gap:9px;justify-content:flex-end;margin:0;padding:0}
.mlv3-dialog menu button{min-height:42px;padding:10px 16px;border-radius:10px;font:700 13.5px/1.2 inherit;cursor:pointer}
.mlv3-cancel{border:1px solid var(--v20-line,#ECE3E2);background:var(--v20-surface,#fff);color:var(--v20-text,#252a31)}
.my-listings-v2-page #myListings .mlv3-menu .crm-danger-button{color:#A74249}
html[data-theme="dark"] .mlv3-thumb{background:#18314e}
html[data-theme="dark"] .mlv3-nophoto,html[data-theme="dark"] .mlv3-deal,html[data-theme="dark"] .mlv3-price.is-empty{color:#b6c7de}
html[data-theme="dark"] .mlv3-missing{color:#E0A33D}
html[data-theme="dark"] body.v20 .mlv3-more{background:#18314e;color:#e9f1ff;border-color:#46617f}
html[data-theme="dark"] .mlv3-menu{background:#10243c;border-color:#304965;box-shadow:0 10px 34px rgb(0 0 0 / 45%)}
html[data-theme="dark"] .my-listings-v2-page #myListings .mlv3-menu a,html[data-theme="dark"] .my-listings-v2-page #myListings .mlv3-menu button{color:#e9f1ff}
html[data-theme="dark"] .my-listings-v2-page #myListings .mlv3-menu a:hover,html[data-theme="dark"] .my-listings-v2-page #myListings .mlv3-menu button:hover{background:#18314e}
html[data-theme="dark"] .my-listings-v2-page #myListings .mlv3-menu .crm-danger-button{color:#ffb1b7}
html[data-theme="dark"] .mlv3-menu hr{border-top-color:#304965}
html[data-theme="dark"] .mlv3-filters button{background:#18314e;color:#e9f1ff;border-color:#46617f}
html[data-theme="dark"] .mlv3-filters button b{color:#fff}
html[data-theme="dark"] .mlv3-filters button[aria-pressed="true"]{background:#216be0;border-color:#216be0}
html[data-theme="dark"] .mlv3-dialog{background:#10243c;color:#e9f1ff}
html[data-theme="dark"] .mlv3-dialog p{color:#b6c7de}
html[data-theme="dark"] .mlv3-tg{background:#2e2720;border-color:#46617f;border-left-color:#E0A33D;color:#f0d9a8}
html[data-theme="dark"] .mlv3-cancel{background:#18314e;color:#e9f1ff;border-color:#46617f}
@media(max-width:700px){
  .my-listings-v2-page #myListings .card.mlv3-row{flex-wrap:wrap}
  .mlv3-act{width:100%}
  .my-listings-v2-page #myListings .mlv3-row .mlv3-open{flex:1}
}`;
    document.head.append(style);
  }

  function ensureDialog() {
    let dialog = document.querySelector("#mlv3Confirm");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "mlv3Confirm";
    dialog.className = "mlv3-dialog";
    dialog.innerHTML = `<form method="dialog">
<h3>Удалить объявление?</h3>
<p id="mlv3ConfirmText"></p>
<div class="mlv3-tg">${escapeHtml(TG_MANUAL)}</div>
<menu>
<button class="mlv3-cancel" value="cancel" type="submit">Отмена</button>
<button class="crm-danger-button" value="ok" type="submit">Удалить навсегда</button>
</menu></form>`;
    document.body.append(dialog);
    return dialog;
  }

  function filtersHost() {
    let host = document.querySelector("#mlv3Filters");
    if (host) return host;
    if (!slot || !slot.parentElement) return null;
    host = document.createElement("div");
    host.id = "mlv3Filters";
    host.className = "mlv3-filters";
    slot.parentElement.insertBefore(host, slot);
    return host;
  }

  function renderFilters(objects) {
    const host = filtersHost();
    if (!host) return;
    // Фильтры появляются только когда в них есть смысл.
    if (objects.length < 4) { host.innerHTML = ""; return; }
    const counts = countsByGroup(objects);
    const items = [["all", "Все"], ["published", "Опубликовано"], ["review", "На проверке"], ["archived", "Архивировано"]];
    host.innerHTML = items.map(([key, label]) =>
      `<button type="button" data-filter="${key}" aria-pressed="${filter === key}">${escapeHtml(label)} <b>${counts[key]}</b></button>`
    ).join("");
  }

  function rowHtml(item) {
    const photo = photoFor(item);
    const removed = isRemoved(item.status);
    const title = buildTitle(item);
    const price = priceText(item);
    const missing = missingFields(item);
    const url = objectUrl(item.id);
    const id = escapeHtml(item.id);
    return `<article class="card mlv3-row${removed ? " is-archived" : ""}" data-object-id="${id}">
<a class="mlv3-thumb" href="${escapeHtml(url)}">${photo
      ? `<img src="${escapeHtml(photo)}" alt="" loading="lazy">`
      : '<span class="mlv3-nophoto">Нет фото</span>'}</a>
<div class="mlv3-main">
<div class="mlv3-top"><span class="card-status">${escapeHtml(statusLabel(item.status))}</span><span class="mlv3-deal">${escapeHtml(text(item.deal) || "Бишкек")}</span></div>
<h2><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></h2>
<strong class="mlv3-price${price ? "" : " is-empty"}">${escapeHtml(price || "Цена не указана")}</strong>
${missing.length ? `<p class="mlv3-missing">Не хватает: ${escapeHtml(missing.join(", "))}</p>` : ""}
${item.moderation_note ? `<p class="card-reject-note">${escapeHtml(item.moderation_note)}</p>` : ""}
</div>
<div class="mlv3-act">
<a class="hero-primary mlv3-open" href="${escapeHtml(url)}">Открыть и редактировать</a>
<button class="mlv3-more" type="button" data-more="${id}" aria-haspopup="menu" aria-expanded="false" aria-label="Ещё действия">···</button>
<div class="mlv3-menu" hidden role="menu">
<a href="/api/crm/object?id=${encodeURIComponent(item.id)}">CRM: собственник и документы</a>
${removed
      ? `<button type="button" data-restore-object="${id}">Восстановить объявление</button>`
      : `<button type="button" data-archive-object="${id}">Архивировать объявление</button>`}
<hr>
<button type="button" class="crm-danger-button" data-permanent-delete-object="${id}">Удалить навсегда</button>
</div></div></article>`;
  }

  function render(objects) {
    currentObjects = Array.isArray(objects) ? objects.slice() : [];
    const count = document.querySelector('.pv2-sidebar-nav [data-count="objects"]');
    if (count) count.textContent = String(currentObjects.length);
    injectStyle();
    if (!currentObjects.length) {
      filter = "all";
      renderFilters(currentObjects);
      slot.innerHTML = '<div class="object-state"><strong>Объявлений пока нет</strong><span>Объявления, добавленные из вашего аккаунта, появятся здесь после отправки на модерацию.</span><a class="hero-primary" href="/add-object.html">Добавить объект</a></div>';
      return;
    }
    renderFilters(currentObjects);
    const visible = filter === "all" ? currentObjects : currentObjects.filter((item) => statusGroup(item) === filter);
    slot.innerHTML = visible.length
      ? visible.map(rowHtml).join("")
      : '<div class="object-state"><strong>Здесь пока пусто</strong><span>В этой группе объявлений нет.</span></div>';
  }

  function closeMenus() {
    document.querySelectorAll("#myListings .mlv3-menu").forEach((menu) => { menu.hidden = true; });
    document.querySelectorAll("#myListings .mlv3-more").forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  async function load({ force = false } = {}) {
    if (loading || (loaded && !force)) return;
    if (!window.LiberterraAgentAccess?.hasUserSession()) {
      slot.innerHTML = '<div class="object-state"><strong>Проверяем ваш аккаунт…</strong><span>Загружаем объявления, привязанные к вашему профилю.</span></div>';
    }
    loading = true;
    try {
      let cachedObjects = [];
      try { cachedObjects = JSON.parse(sessionStorage.getItem("liberterra-my-listings") || "[]"); } catch (_) {}
      if (Array.isArray(cachedObjects) && cachedObjects.length) render(cachedObjects);
      const response = await window.LiberterraAgentAccess.request("get_user_objects");
      const objects = response.objects || [];
      try { sessionStorage.setItem("liberterra-my-listings", JSON.stringify(objects)); } catch (_) {}
      render(objects);
      loaded = true;
    } catch (error) {
      if (!slot.querySelector(".card")) slot.innerHTML = `<div class="object-state"><strong>Не удалось загрузить объявления</strong><span>${escapeHtml(error.message)}</span><a class="hero-primary" href="/profile.html">Войти в аккаунт</a></div>`;
    } finally { loading = false; }
  }

  const languagePicker = document.querySelector("#profileLanguage");
  if (languagePicker) {
    const syncLanguage = () => {
      const language = window.LiberterraI18n?.language || document.documentElement.lang || "ru";
      if (["ru", "ky", "en", "zh"].includes(language)) languagePicker.value = language;
    };
    languagePicker.addEventListener("change", () => window.LiberterraI18n?.setLanguage(languagePicker.value));
    window.addEventListener("liberterra:languagechange", syncLanguage);
    document.addEventListener("DOMContentLoaded", syncLanguage, { once: true });
    syncLanguage();
  }

  window.addEventListener("liberterra:agent-role", () => load(), { once: true });
  window.addEventListener("liberterra:user-registered", () => load({ force: true }));
  window.setTimeout(load, 100);

  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.closest("#myListings")) return;
    const thumb = image.closest(".mlv3-thumb");
    if (thumb) thumb.innerHTML = '<span class="mlv3-nophoto">Фото недоступно</span>';
  }, true);

  document.addEventListener("click", (event) => {
    const chip = event.target.closest("#mlv3Filters [data-filter]");
    if (chip) { filter = chip.dataset.filter; render(currentObjects); return; }
    const toggle = event.target.closest("#myListings .mlv3-more");
    if (!toggle) { closeMenus(); return; }
    const menu = toggle.parentElement.querySelector(".mlv3-menu");
    const willOpen = menu.hidden;
    closeMenus();
    menu.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenus(); });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-archive-object], [data-restore-object], [data-permanent-delete-object]");
    if (!button) return;
    const restoring = Boolean(button.dataset.restoreObject);
    const permanent = Boolean(button.dataset.permanentDeleteObject);
    const objectId = button.dataset.restoreObject || button.dataset.archiveObject || button.dataset.permanentDeleteObject;
    const item = currentObjects.find((entry) => String(entry.id) === String(objectId));
    closeMenus();

    if (permanent) {
      const dialog = ensureDialog();
      const confirmText = dialog.querySelector("#mlv3ConfirmText");
      if (confirmText) confirmText.textContent = `${item ? buildTitle(item) : "Объявление"} будет удалено навсегда. Отменить это нельзя.`;
      dialog.returnValue = "";
      const decided = await new Promise((resolve) => {
        dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
        if (typeof dialog.showModal === "function") dialog.showModal();
        else resolve(false);
      });
      if (!decided) return;
    }

    button.disabled = true;
    try {
      if (permanent) {
        await window.LiberterraAgentAccess.request("delete_user_object", { object_id: objectId });
        currentObjects = currentObjects.filter((entry) => String(entry.id) !== String(objectId));
      } else {
        await window.LiberterraAgentAccess.request("update_agent_object", {
          object_id: objectId,
          changes: { status: restoring ? "на модерации" : "снят" },
        });
        currentObjects = currentObjects.map((entry) => String(entry.id) === String(objectId)
          ? { ...entry, status: restoring ? "на модерации" : "снят" }
          : entry);
      }
      try { sessionStorage.removeItem("liberterra-my-listings"); } catch (_) {}
      showNotice(permanent
        ? `Объявление удалено навсегда. ${TG_MANUAL}`
        : restoring
          ? "Объявление отправлено на проверку"
          : `Объявление архивировано. ${TG_MANUAL}`);
      render(currentObjects);
    } catch (error) {
      button.disabled = false;
      window.alert(error?.message || "Не удалось изменить объявление.");
    }
  });
})();
