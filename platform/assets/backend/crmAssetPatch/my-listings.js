(() => {
  "use strict";
  const slot = document.querySelector("#myListings");
  let loading = false;
  let loaded = false;
  let currentObjects = [];
  const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const statusLabel = (value) => ({ "опубликован": "Опубликовано", "на модерации": "На проверке", "снят": "Архивировано", "снято": "Архивировано", "архив": "Архивировано", "archive": "Архивировано" }[String(value || "").toLowerCase()] || value || "На проверке");
  const isRemoved = (value) => ["снят", "снято", "removed", "архив", "archive", "неактуален"].includes(String(value || "").trim().toLowerCase());
  const normalizePhoto = (value) => {
    const source = String(value || "").trim();
    if (!source) return "";
    const filename = source.split(/[?#]/, 1)[0].split("/").pop();
    return /^object_[^/]+\.(?:jpe?g|png|webp)$/i.test(filename || "")
      ? `${PHOTO_DELIVERY_ORIGIN}/uploads/${encodeURIComponent(filename)}`
      : source;
  };
  const firstPhoto = (value) => normalizePhoto(String(value || "").split(/\s*(?:\||\n)\s*/).map((url) => url.trim()).filter(Boolean)[0] || "");
  const catalogPhoto = (id) => {
    const row = (window.LIBERTERRA_LOCAL_OBJECTS || []).find((item) => String(item.id) === String(id));
    return firstPhoto(row?.photo_url);
  };
  const photoFor = (item) => firstPhoto(item.photo_url)
    || catalogPhoto(item.id)
    || `${PHOTO_DELIVERY_ORIGIN}/uploads/object_${encodeURIComponent(item.id)}_1.jpg`;
  const showNotice = (message) => {
    document.querySelector(".cabinet-notice")?.remove();
    const notice = document.createElement("div");
    notice.className = "cabinet-notice";
    notice.setAttribute("role", "status");
    notice.textContent = message;
    document.body.append(notice);
    window.setTimeout(() => notice.remove(), 3500);
  };
  const objectUrl = (id) => {
    const currentLaunch = `${window.location.search}${window.location.hash}`;
    if (/[?&#]tgWebApp(?:Data|Version|Platform)=/i.test(currentLaunch)) sessionStorage.setItem("liberterra_telegram_launch", currentLaunch);
    const telegramLaunch = /[?&#]tgWebApp(?:Data|Version|Platform)=/i.test(currentLaunch)
      ? currentLaunch
      : sessionStorage.getItem("liberterra_telegram_launch") || "";
    const suffix = /[?&#]tgWebApp(?:Version|Platform)=/i.test(telegramLaunch) ? telegramLaunch : "";
    return `/object/${encodeURIComponent(id)}${suffix}`;
  };
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

  function render(objects) {
      currentObjects = Array.isArray(objects) ? objects.slice() : [];
      if (!objects.length) {
        slot.innerHTML = '<div class="object-state"><strong>Объявлений пока нет</strong><span>Объявления, добавленные из вашего аккаунта, появятся здесь после отправки на модерацию.</span><a class="hero-primary" href="/add-object.html">Добавить объект</a></div>';
        return;
      }
      slot.innerHTML = objects.map((item) => {
        const photo = photoFor(item);
        const removed = isRemoved(item.status);
        return `<article class="card${removed ? " is-archived" : ""}">${photo ? `<div class="photo"><img src="${escapeHtml(photo)}" alt="${escapeHtml(item.title || `Объект №${item.id}`)}" loading="lazy"></div>` : '<div class="photo"><div class="photo-placeholder">Фото готовится</div></div>'}<div class="card-body"><span class="card-status">${escapeHtml(statusLabel(item.status))}</span><h2>${escapeHtml(item.title || `Объект №${item.id}`)}</h2><p>${escapeHtml(item.district || "Бишкек")}</p><strong>${escapeHtml(item.price || "Цена не указана")}</strong><a class="hero-primary" href="${escapeHtml(objectUrl(item.id))}">Открыть и редактировать</a><a class="crm-secondary-button" href="/api/crm/object?id=${encodeURIComponent(item.id)}">CRM: собственник и документы</a>${removed ? `<button class="crm-secondary-button" type="button" data-restore-object="${escapeHtml(item.id)}">Восстановить объявление</button>` : `<button class="crm-secondary-button" type="button" data-archive-object="${escapeHtml(item.id)}">Архивировать объявление</button>`}<button class="crm-danger-button" type="button" data-permanent-delete-object="${escapeHtml(item.id)}">Удалить навсегда</button></div></article>`;
      }).join("");
  }
  window.addEventListener("liberterra:agent-role", () => load(), { once: true });
  window.addEventListener("liberterra:user-registered", () => load({ force: true }));
  window.setTimeout(load, 100);
  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.closest("#myListings")) return;
    const photo = image.closest(".photo");
    if (photo) photo.innerHTML = '<div class="photo-placeholder">Фото готовится</div>';
  }, true);
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-archive-object], [data-restore-object], [data-permanent-delete-object]");
    if (!button) return;
    const restoring = Boolean(button.dataset.restoreObject);
    const permanent = Boolean(button.dataset.permanentDeleteObject);
    if (permanent) {
      const confirmation = window.prompt("Удалить объявление без возможности восстановления? Введите УДАЛИТЬ");
      if (String(confirmation || "").trim().toUpperCase() !== "УДАЛИТЬ") return;
    } else if (!restoring && !window.confirm("Переместить объявление в архив? Его можно будет восстановить.")) return;
    button.disabled = true;
    button.textContent = permanent ? "Удаляем..." : restoring ? "Восстанавливаем..." : "Архивируем...";
    try {
      const objectId = button.dataset.restoreObject || button.dataset.archiveObject || button.dataset.permanentDeleteObject;
      if (permanent) {
        await window.LiberterraAgentAccess.request("delete_user_object", { object_id: objectId });
        currentObjects = currentObjects.filter((item) => String(item.id) !== String(objectId));
      } else {
        await window.LiberterraAgentAccess.request("update_agent_object", {
          object_id: objectId,
          changes: { status: restoring ? "на модерации" : "снят" },
        });
        currentObjects = currentObjects.map((item) => String(item.id) === String(objectId)
          ? { ...item, status: restoring ? "на модерации" : "снят" }
          : item);
      }
      try { sessionStorage.removeItem("liberterra-my-listings"); } catch (_) {}
      showNotice(permanent ? "Объявление удалено навсегда" : restoring ? "Объявление отправлено на проверку" : "Объявление архивировано");
      render(currentObjects);
    } catch (error) {
      button.disabled = false;
      button.textContent = permanent ? "Удалить навсегда" : restoring ? "Восстановить объявление" : "Архивировать объявление";
      window.alert(error?.message || "Не удалось изменить объявление.");
    }
  });
})();
