(() => {
  "use strict";
  const slot = document.querySelector("#myRequests");
  let loading = false;
  let loaded = false;
  let lastRequests = [];
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const removed = (value) => ["снят", "снято", "removed", "архив", "archive", "неактуален"].includes(String(value || "").trim().toLowerCase());
  const statusLabel = (value) => {
    const status = String(value || "").trim().toLowerCase();
    if (removed(status)) return "Закрыта";
    if (["на модерации", "pending", "на проверке"].includes(status)) return "На проверке";
    return "Активна";
  };

  function dateLabel(value) {
    const language = window.LiberterraI18n?.language || "ru";
    if (!value) return window.LiberterraI18n?.t("Дата не указана") || "Дата не указана";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return window.LiberterraI18n?.t("Дата не указана") || "Дата не указана";
    const locale = language === "zh" ? "zh-CN" : language === "en" ? "en-US" : "ru-RU";
    const formatted = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Bishkek", day: "numeric", month: "long", year: "numeric" }).format(date);
    if (language === "zh") return `创建于 ${formatted}`;
    if (language === "en") return `Created ${formatted}`;
    return `Создана ${formatted}`;
  }

  function card(item) {
    const inactive = removed(item.status);
    return `<article class="card request-owner-card${inactive ? " is-archived" : ""}" data-request-card="${esc(item.id)}">
      <div class="card-body">
        <div class="request-owner-meta"><span class="card-status">${statusLabel(item.status)}</span><span>${esc(dateLabel(item.created_at))}</span></div>
        <h2>${esc(item.title || "Заявка на поиск")}</h2>
        <p>${esc(item.district || "Район не указан")} · ${esc(item.price || "Бюджет не указан")}</p>
        <div class="request-owner-actions">
          <button class="hero-primary" type="button" data-request-edit="${esc(item.id)}">Редактировать заявку</button>
          <button class="crm-secondary-button" type="button" data-request-status="${inactive ? "опубликован" : "снят"}" data-request-id="${esc(item.id)}">${inactive ? "Активировать снова" : "Закрыть заявку"}</button>
        </div>
        <form class="request-owner-form" data-request-form="${esc(item.id)}" hidden>
          <div class="submission-grid two">
            <label><span>Название заявки *</span><input name="title" value="${esc(item.title)}" maxlength="240" required></label>
            <label><span>Район или ориентир *</span><input name="district" value="${esc(item.district)}" maxlength="240" required></label>
            <label><span>Количество комнат</span><input name="rooms" value="${esc(item.rooms)}" maxlength="20"></label>
            <label><span>Бюджет *</span><input name="price" value="${esc(item.price)}" maxlength="240" required></label>
            <label><span>Имя *</span><input name="contact_name" value="${esc(item.contact_name)}" maxlength="120" autocomplete="name" required></label>
            <label><span>Телефон *</span><input name="phone" value="${esc(item.phone)}" maxlength="40" autocomplete="tel" inputmode="tel" required></label>
          </div>
          <label><span>Описание и пожелания</span><textarea name="description" rows="5" maxlength="700">${esc(item.description)}</textarea></label>
          <p class="request-owner-message" data-request-message role="status" hidden></p>
          <div class="request-owner-form-actions"><button class="submission-submit" type="submit">Сохранить изменения</button><button class="crm-secondary-button" type="button" data-request-cancel="${esc(item.id)}">Отмена</button></div>
        </form>
      </div>
    </article>`;
  }

  function toggleEditor(cardNode, visible) {
    const form = cardNode?.querySelector("[data-request-form]");
    const actions = cardNode?.querySelector(".request-owner-actions");
    if (!form) return;
    form.hidden = !visible;
    if (actions) actions.hidden = visible;
    if (visible) form.querySelector("input")?.focus();
  }

  function render(requests) {
    const count = document.querySelector('[data-count="requests"]');
    if (count) count.textContent = String(requests.length);
    slot.innerHTML = requests.length ? requests.map(card).join("") : '<div class="object-state"><strong>Заявок пока нет</strong><span>Создайте заявку, и она появится здесь.</span><a class="hero-primary" href="/add-request.html">Оставить заявку</a></div>';
  }

  async function load({ force = false } = {}) {
    if (loading || (loaded && !force)) return;
    loading = true;
    try {
      const response = await window.LiberterraAgentAccess.request("get_user_requests", {});
      lastRequests = response.requests || [];
      render(lastRequests);
      loaded = true;
    } catch (error) {
      const loginRequired = error.code === "registration_required" || error.code === "unauthorized";
      slot.innerHTML = loginRequired
        ? '<div class="object-state"><strong>Войдите в аккаунт</strong><span>После входа здесь появятся заявки, связанные с вашим профилем.</span><a class="hero-primary" href="/profile">Открыть профиль</a></div>'
        : `<div class="object-state"><strong>Не удалось загрузить заявки</strong><span>${esc(error.message)}</span><button class="hero-primary" type="button" data-request-retry>Повторить</button></div>`;
    } finally { loading = false; }
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-request-form]");
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector("button[type=submit]");
    const message = form.querySelector("[data-request-message]");
    button.disabled = true;
    button.textContent = "Сохраняем…";
    if (message) message.hidden = true;
    try {
      const data = new FormData(form);
      await window.LiberterraAgentAccess.request("update_user_request", { request_id: form.dataset.requestForm, changes: Object.fromEntries(data.entries()) });
      if (message) { message.textContent = "Изменения сохранены"; message.hidden = false; }
      button.textContent = "Сохранено";
      await load({ force: true });
    } catch (error) {
      button.disabled = false;
      button.textContent = "Сохранить изменения";
      if (message) { message.textContent = error.code === "request_edit_denied" ? "Редактировать эту заявку может только её автор." : "Не удалось сохранить изменения. Попробуйте ещё раз."; message.hidden = false; }
    }
  });

  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-request-retry]")) { load({ force: true }); return; }
    const editButton = event.target.closest("[data-request-edit]");
    if (editButton) {
      toggleEditor(editButton.closest("[data-request-card]"), true);
      return;
    }
    const cancelButton = event.target.closest("[data-request-cancel]");
    if (cancelButton) {
      toggleEditor(cancelButton.closest("[data-request-card]"), false);
      return;
    }
    const button = event.target.closest("[data-request-status]");
    if (!button) return;
    button.disabled = true;
    try {
      await window.LiberterraAgentAccess.request("update_user_request", { request_id: button.dataset.requestId, changes: { status: button.dataset.requestStatus } });
      await load({ force: true });
    } catch (error) { button.disabled = false; window.alert(error.message || "Не удалось изменить статус заявки"); }
  });

  const languagePicker = document.querySelector("#profileLanguage");
  if (languagePicker) {
    const syncLanguage = () => {
      const language = window.LiberterraI18n?.language || document.documentElement.lang || "ru";
      if (["ru", "ky", "en", "zh"].includes(language)) languagePicker.value = language;
    };
    languagePicker.addEventListener("change", () => window.LiberterraI18n?.setLanguage(languagePicker.value));
    window.addEventListener("liberterra:languagechange", syncLanguage);
    syncLanguage();
  }

  window.addEventListener("liberterra:agent-role", () => load(), { once: true });
  window.addEventListener("liberterra:user-registered", () => load({ force: true }));
  window.addEventListener("liberterra:languagechange", () => { if (loaded) render(lastRequests); });
  load();
})();
