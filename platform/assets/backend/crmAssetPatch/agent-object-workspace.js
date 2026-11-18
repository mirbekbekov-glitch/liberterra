(() => {
  "use strict";
  const pathObjectMatch = location.pathname.match(/^\/object\/([^/]+)\/?$/i);
  let objectId = new URLSearchParams(location.search).get("id")
    || (pathObjectMatch ? decodeURIComponent(pathObjectMatch[1]) : "");
  let workspace = null;
  let loadedObjectId = "";
  let workspaceRetryCount = 0;
  let ownerLocationMap = null;
  let ownerLocationMarker = null;
  const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const text = (value) => String(value ?? "").trim();
  const COMMENT_LIMIT = 500;
  const PRIVATE_SCOPES = [
    ["owner_contact", "Контакты собственника"],
    ["legal_docs", "Правоустанавливающие документы"],
    ["owner_contract", "Договор с собственником"],
    ["other_docs", "Другие документы"],
    ["work_notes", "Рабочая информация"],
  ];
  const COMMENT_ERROR_MESSAGES = {
    comment_required: "Напишите комментарий.",
    comment_too_long: "Комментарий должен быть не длиннее 500 символов.",
    comment_rate_limited: "Слишком много комментариев. Подождите минуту и попробуйте снова.",
    comment_manage_denied: "Недостаточно прав для изменения этого комментария.",
    comment_not_found: "Комментарий уже удалён или не найден.",
    agent_not_approved: "Комментарии доступны после регистрации в Liberterra.",
    access_denied: "Комментарии доступны после регистрации в Liberterra.",
    registration_required: "Сначала завершите регистрацию в Liberterra.",
  };
  const commentErrorMessage = (error) => COMMENT_ERROR_MESSAGES[error?.code]
    || COMMENT_ERROR_MESSAGES[error?.message]
    || error?.message
    || "Не удалось выполнить действие. Попробуйте ещё раз.";
  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? text(value)
      : new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  };
  const photoUrls = (value) => text(value).split(/\s*(?:\||\n)\s*/).filter(Boolean).map((source) => {
    const filename = source.split(/[?#]/, 1)[0].split("/").pop();
    return /^object_[^/]+\.(?:jpe?g|png|webp)$/i.test(filename || "")
      ? `${PHOTO_DELIVERY_ORIGIN}/uploads/${encodeURIComponent(filename)}`
      : source;
  }).slice(0, 5);

  function ownerEditorHtml() {
    if (!workspace.can_edit_object) return "";
    const item = workspace.object || {};
    const photos = photoUrls(item.photo_url);
    return `
      <section class="agent-comments-panel owner-edit-panel" aria-labelledby="ownerEditTitle">
        <div class="agent-comments-heading"><div><h3 id="ownerEditTitle">Редактировать моё объявление</h3><p>После сохранения изменения повторно проверит модератор.</p></div></div>
        <form class="agent-comment-form owner-edit-form" data-owner-edit-form>
          <div class="agent-workspace-grid">
            <label class="crm-field"><span>Название</span><input name="title" maxlength="240" value="${escapeHtml(item.title)}"></label>
            <label class="crm-field"><span>Цена</span><input name="price" maxlength="60" value="${escapeHtml(item.price)}"></label>
            <label class="crm-field"><span>Район</span><input name="district" maxlength="240" value="${escapeHtml(item.district)}"></label>
            <label class="crm-field"><span>Комнат</span><input name="rooms" maxlength="20" value="${escapeHtml(item.rooms)}"></label>
            <label class="crm-field"><span>Площадь, м²</span><input name="area" maxlength="30" value="${escapeHtml(item.area)}"></label>
            <label class="crm-field"><span>Этаж</span><input name="floor" maxlength="20" value="${escapeHtml(item.floor)}"></label>
          </div>
          <label class="crm-field"><span>Описание</span><textarea name="description" rows="5" maxlength="700">${escapeHtml(item.description)}</textarea><small>До 700 символов. Оставьте только важные особенности и условия.</small></label>
          <fieldset class="owner-location-editor"><legend>Расположение на карте</legend><p>Нажмите на карту, чтобы поставить или изменить точку объекта.</p><div class="owner-location-map" data-owner-location-map></div><input type="hidden" name="latitude" value="${escapeHtml(item.latitude)}"><input type="hidden" name="longitude" value="${escapeHtml(item.longitude)}"><div class="owner-location-actions"><span data-owner-location-status>${item.latitude && item.longitude ? "Точка объекта указана" : "Точка пока не указана"}</span><button type="button" data-workspace-action="clear-owner-location" ${item.latitude && item.longitude ? "" : "hidden"}>Убрать точку</button></div></fieldset>
          ${photos.length ? `<fieldset class="owner-photo-editor"><legend>Фотографии</legend><p>Снимите отметку с фото, которое нужно удалить.</p><div class="owner-photo-grid">${photos.map((url, index) => `<label><img src="${escapeHtml(url)}" alt="Фото ${index + 1}" loading="lazy" decoding="async"><input type="checkbox" name="keep_photo" value="${escapeHtml(url)}" checked><span>Оставить</span></label>`).join("")}</div></fieldset>` : ""}
          <label class="owner-photo-upload"><span>Добавить фотографии</span><input type="file" name="new_photos" accept="image/jpeg,image/png,image/webp" multiple><small>JPEG, PNG или WebP, до 8 МБ. Всего в объявлении — не больше 5 фото.</small><em data-new-photo-list>Файлы не выбраны</em></label>
          <div class="agent-workspace-action-row"><span data-owner-edit-message aria-live="polite"></span><button class="crm-primary-button" type="submit">Сохранить изменения</button></div>
          <div class="owner-delete-row"><button class="crm-danger-button" type="button" data-workspace-action="delete-object">Удалить объявление</button><small>Объявление исчезнет из каталога. Восстановить его сможет администратор.</small></div>
        </form>
      </section>`;
  }

  function initOwnerLocationMap() {
    const node = document.querySelector("[data-owner-location-map]");
    if (!node || !window.L) return;
    if (ownerLocationMap) { ownerLocationMap.remove(); ownerLocationMap = null; ownerLocationMarker = null; }
    const form = node.closest("form");
    const latInput = form.querySelector('[name="latitude"]');
    const lngInput = form.querySelector('[name="longitude"]');
    const status = form.querySelector("[data-owner-location-status]");
    const clear = form.querySelector('[data-workspace-action="clear-owner-location"]');
    const lat = Number.parseFloat(latInput.value.replace(",", "."));
    const lng = Number.parseFloat(lngInput.value.replace(",", "."));
    const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
    ownerLocationMap = L.map(node).setView(hasPoint ? [lat, lng] : [42.8746, 74.5698], hasPoint ? 16 : 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(ownerLocationMap);
    if (hasPoint) ownerLocationMarker = L.marker([lat, lng]).addTo(ownerLocationMap);
    ownerLocationMap.on("click", ({ latlng }) => {
      latInput.value = latlng.lat.toFixed(6); lngInput.value = latlng.lng.toFixed(6);
      ownerLocationMarker = ownerLocationMarker || L.marker(latlng).addTo(ownerLocationMap);
      ownerLocationMarker.setLatLng(latlng); status.textContent = "Новая точка выбрана"; clear.hidden = false;
    });
    window.setTimeout(() => ownerLocationMap?.invalidateSize(), 100);
  }
  const experienceLabel = (value) => {
    const years = Number(value);
    if (!Number.isInteger(years)) return value ? `Опыт: ${value}` : "";
    const lastTwo = years % 100;
    const last = years % 10;
    const word = lastTwo >= 11 && lastTwo <= 14 ? "лет" : last === 1 ? "год" : last >= 2 && last <= 4 ? "года" : "лет";
    return `Опыт: ${years} ${word}`;
  };

  async function renderPublicAgent() {
    const slot = document.querySelector("[data-object-listing-agent]");
    if (!slot || !objectId || slot.dataset.loaded === "true") return;
    if (document.querySelector("#objectPage")?.dataset.recordKind === "request") {
      slot.remove();
      return;
    }
    slot.dataset.loaded = "true";
    try {
      const response = await window.LiberterraAgentAccess.publicRequest("get_public_object_agent", {
        object_id: objectId,
      });
      if (!response.agent?.public_ref) {
        slot.remove();
        return;
      }
      const name = text(response.agent.name) || "Агент Liberterra";
      const agency = text(response.agent.agency);
      window.dispatchEvent(new CustomEvent("liberterra:listing-agent-loaded", {
        detail: { agent: { name, agency, phone: response.agent.phone || "", publicRef: response.agent.public_ref, avatar_url: response.agent.avatar_url || "" } },
      }));
      const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "А";
      const rawRating = text(response.agent.rating);
      const rating = rawRating ? Number(rawRating) : NaN;
      const hasRating = Number.isFinite(rating) && rating >= 1 && rating <= 5;
      const ratingText = hasRating ? `★ ${rating.toFixed(1)} / 5` : "Новый агент";
      const experience = text(response.agent.experience);
      const activeCount = Number(response.agent.active_object_count || 0);
      const objectWord = activeCount === 1 ? "объект" : activeCount >= 2 && activeCount <= 4 ? "объекта" : "объектов";
      slot.innerHTML = `
        <a class="object-agent-profile" href="/agent-public.html?agent=${encodeURIComponent(response.agent.public_ref)}">
          <span class="object-agent-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
          <span class="object-agent-main">
            <small>Агент</small>
            <strong>${escapeHtml(name)}</strong>
            ${agency ? `<span class="object-agent-agency">Компания: ${escapeHtml(agency)}</span>` : ""}
            <em class="${hasRating ? "has-rating" : ""}">${escapeHtml(ratingText)}</em>
            ${experience ? `<span class="object-agent-experience">${escapeHtml(experienceLabel(experience))}</span>` : ""}
          </span>
          <span class="object-agent-count">${activeCount} ${objectWord}</span>
        </a>
      `;
    } catch (_) {
      slot.remove();
    }
  }

  function updateCommentFormState(form) {
    if (!form) return;
    const textarea = form.querySelector("textarea");
    const count = form.querySelector("[data-workspace-comment-count]");
    const submit = form.querySelector('[type="submit"]');
    if (!textarea || !submit) return;

    const value = textarea.value.trim();
    if (count) {
      count.textContent = `${textarea.value.length} / ${COMMENT_LIMIT}`;
      count.classList.toggle("is-over-limit", textarea.value.length > COMMENT_LIMIT);
    }
    submit.disabled = !value
      || textarea.value.length > COMMENT_LIMIT
      || form.dataset.sending === "true";
  }

  function commentsHtml(comments) {
    if (!comments.length) {
      return '<div class="agent-workspace-empty">Комментариев пока нет. Задайте первый вопрос об объекте.</div>';
    }
    return comments.map((comment) => `
      <article class="agent-comment" data-comment-id="${escapeHtml(comment.comment_id)}">
        <div class="agent-comment-avatar" aria-hidden="true">${escapeHtml(text(comment.agent_name).slice(0, 1).toUpperCase() || "А")}</div>
        <div class="agent-comment-body">
          <div class="agent-comment-meta">
            <strong>${escapeHtml(comment.agent_name)}</strong>
            <span class="agent-comment-time">
              <time>${escapeHtml(formatDate(comment.created_at))}</time>
              ${comment.edited ? '<span class="agent-comment-edited">изменено</span>' : ""}
            </span>
          </div>
          <div class="agent-comment-text" data-comment-text>${escapeHtml(comment.text)}</div>
          ${comment.can_edit || comment.can_delete ? `
            <div class="agent-comment-actions">
              ${comment.can_edit ? '<button type="button" data-workspace-action="edit-comment">Изменить</button>' : ""}
              ${comment.can_delete ? '<button class="agent-comment-delete-button" type="button" data-workspace-action="delete-comment">Удалить</button>' : '<button type="button" data-workspace-action="report-comment">Пожаловаться</button>'}
            </div>
          ` : ""}
        </div>
      </article>
    `).join("");
  }

  function privateDocumentsHtml(documents, canManage) {
    if (!documents?.length) return '<p class="agent-workspace-hint">Документов пока нет.</p>';
    return `<ul class="agent-private-documents">${documents.map((doc) => `<li><span>${escapeHtml(doc.name)} · ${escapeHtml(PRIVATE_SCOPES.find(([key]) => key === doc.category)?.[1] || "Документ")}</span><button type="button" class="crm-secondary-button crm-small-button" data-workspace-action="download-private-document" data-document-id="${escapeHtml(doc.id)}">Скачать</button></li>`).join("")}</ul>`;
  }

  function renderPrivatePanel(result, requests = { incoming: [], outgoing: [] }) {
    const panel = document.querySelector("[data-private-object-panel]");
    if (!panel) return;
    if (result?.is_owner) {
      const data = result.data || {};
      panel.innerHTML = `
        <h3>Закрытая CRM-карточка объекта</h3>
        <p>Эти сведения видны только вам. Для других агентов откроются лишь категории, которые вы отдельно одобрите.</p>
        <form data-private-object-form>
          <div class="agent-workspace-grid">
            <label class="crm-field"><span>Имя собственника</span><input name="owner_contact_name" maxlength="120" value="${escapeHtml(data.owner_contact_name)}"></label>
            <label class="crm-field"><span>Телефон собственника</span><input name="owner_contact_phone" maxlength="40" value="${escapeHtml(data.owner_contact_phone)}"></label>
            <label class="crm-field"><span>WhatsApp</span><input name="owner_contact_whatsapp" maxlength="40" value="${escapeHtml(data.owner_contact_whatsapp)}"></label>
            <label class="crm-field"><span>Юридический статус / заметки по документам</span><textarea name="legal_status" rows="3" maxlength="500">${escapeHtml(data.legal_status)}</textarea></label>
            <label class="crm-field"><span>Рабочая информация (только для вас)</span><textarea name="work_notes" rows="4" maxlength="3000">${escapeHtml(data.work_notes)}</textarea></label>
          </div>
          <div class="agent-workspace-action-row"><span data-private-message aria-live="polite"></span><button class="crm-primary-button crm-small-button" type="submit">Сохранить закрытые данные</button></div>
        </form>
        <form data-private-upload-form>
          <label class="owner-photo-upload"><span>Загрузить закрытый документ</span><select name="category" required>${PRIVATE_SCOPES.filter(([key]) => key.endsWith("docs") || key === "owner_contract").map(([key, label]) => `<option value="${key}">${escapeHtml(label)}</option>`).join("")}</select><input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required><small>PDF, JPG или PNG, до 5 МБ. Файл хранится приватно, вне публичных фотографий объявления.</small></label>
          <button class="crm-secondary-button crm-small-button" type="submit">Загрузить документ</button>
        </form>
        ${privateDocumentsHtml(data.documents, true)}
        <h4>Запросы доступа к этому объекту</h4>
        ${requests.incoming?.filter((item) => String(item.object_id) === String(objectId)).length ? requests.incoming.filter((item) => String(item.object_id) === String(objectId)).map((item) => `<article class="agent-private-access-request"><strong>${escapeHtml(item.requester_name || "Агент")}</strong><p>${item.status === "approved" ? "Доступ предоставлен:" : "Запрашивает:"} ${escapeHtml((item.status === "approved" ? item.granted_scopes : item.requested_scopes).map((scope) => PRIVATE_SCOPES.find(([key]) => key === scope)?.[1] || scope).join(", "))}</p>${item.status === "approved" ? `<button type="button" class="crm-secondary-button crm-small-button" data-workspace-action="revoke-private-access" data-request-id="${escapeHtml(item.request_id)}">Отозвать доступ</button>` : `<div>${item.requested_scopes.map((scope) => `<label><input type="checkbox" data-grant-scope="${escapeHtml(scope)}" data-request-id="${escapeHtml(item.request_id)}" checked> ${escapeHtml(PRIVATE_SCOPES.find(([key]) => key === scope)?.[1] || scope)}</label>`).join(" ")}</div><button type="button" class="crm-primary-button crm-small-button" data-workspace-action="approve-private-request" data-request-id="${escapeHtml(item.request_id)}">Одобрить выбранное</button> <button type="button" class="crm-secondary-button crm-small-button" data-workspace-action="deny-private-request" data-request-id="${escapeHtml(item.request_id)}">Отклонить</button>`}</article>`).join("") : '<p class="agent-workspace-hint">Новых запросов доступа нет.</p>'}
        ${requests.outgoing?.filter((item) => String(item.object_id) === String(objectId) && item.status === "approved").map((item) => `<p>Доступ агенту предоставлен: ${escapeHtml(item.granted_scopes.join(", "))} <button type="button" class="crm-secondary-button crm-small-button" data-workspace-action="revoke-private-access" data-request-id="${escapeHtml(item.request_id)}">Отозвать</button></p>`).join("") || ""}`;
    } else if (result?.access_required) {
      const outgoing = requests.outgoing?.find((item) => String(item.object_id) === String(objectId) && ["pending", "approved"].includes(item.status));
      panel.innerHTML = `<h3>Закрытая информация собственника</h3><p>Контакты и документы доступны только с разрешения разместившего агента.</p>${outgoing ? `<p>Статус запроса: <strong>${outgoing.status === "pending" ? "ожидает решения" : "доступ одобрен"}</strong></p>${outgoing.status === "approved" ? '<button type="button" class="crm-secondary-button crm-small-button" data-workspace-action="reload-private-data">Открыть разрешённые данные</button>' : ""}` : `<form data-private-request-form><fieldset><legend>Что запросить</legend>${PRIVATE_SCOPES.map(([key, label]) => `<label><input type="checkbox" name="scope" value="${key}"> ${escapeHtml(label)}</label>`).join("")}</fieldset><button class="crm-primary-button crm-small-button" type="submit">Запросить у агента</button><span data-private-message aria-live="polite"></span></form>`}`;
    } else {
      const data = result?.data || {};
      const hasData = result?.access_required === false;
      panel.innerHTML = `<h3>${result?.is_owner ? "Закрытая CRM-карточка объекта" : "Разрешённые закрытые данные"}</h3>${hasData ? `<dl>${data.owner_contact_name ? `<dt>Собственник</dt><dd>${escapeHtml(data.owner_contact_name)}</dd>` : ""}${data.owner_contact_phone ? `<dt>Телефон</dt><dd><a href="tel:${escapeHtml(data.owner_contact_phone)}">${escapeHtml(data.owner_contact_phone)}</a></dd>` : ""}${data.owner_contact_whatsapp ? `<dt>WhatsApp</dt><dd><a href="https://wa.me/${encodeURIComponent(data.owner_contact_whatsapp.replace(/\D/g, ""))}" target="_blank" rel="noopener">${escapeHtml(data.owner_contact_whatsapp)}</a></dd>` : ""}${data.legal_status ? `<dt>Юридический статус</dt><dd>${escapeHtml(data.legal_status)}</dd>` : ""}${data.work_notes ? `<dt>Рабочая информация</dt><dd>${escapeHtml(data.work_notes)}</dd>` : ""}</dl>${privateDocumentsHtml(data.documents, false)}` : '<p>Нет доступных закрытых данных.</p>'}<button type="button" class="crm-secondary-button crm-small-button" data-workspace-action="reload-private-data">Обновить доступ</button>`;
    }
  }

  async function loadPrivatePanel() {
    const panel = document.querySelector("[data-private-object-panel]");
    if (!panel || workspace?.role !== "approved") return;
    panel.innerHTML = '<p>Загружаем закрытую CRM-карточку...</p>';
    try {
      const [result, requests] = await Promise.all([
        window.LiberterraAgentAccess.request("get_agent_private_object", { object_id: objectId }),
        window.LiberterraAgentAccess.request("list_agent_private_access", {}),
      ]);
      renderPrivatePanel(result, requests);
    } catch (error) {
      panel.innerHTML = `<p>Закрытые данные не загружены: ${escapeHtml(commentErrorMessage(error))}</p><button type="button" class="crm-secondary-button crm-small-button" data-workspace-action="reload-private-data">Повторить</button>`;
    }
  }

  function renderWorkspace() {
    if ((workspace?.can_edit_object || workspace?.can_moderate_object) && document.querySelector("#objectPage > .object-state")) {
      const item = workspace.object || {};
      const rawStatus = text(item.status).toLowerCase();
      const status = ["снят", "снято", "removed", "архив", "archive"].includes(rawStatus)
        ? "Архивировано"
        : rawStatus === "опубликован" ? "Опубликовано" : "На проверке";
      const page = document.querySelector("#objectPage");
      page.innerHTML = `
        <section class="owner-private-object" aria-labelledby="ownerPrivateObjectTitle">
          <span class="owner-private-status">${escapeHtml(status)}${workspace.can_moderate_object ? " · просмотр модератора" : ""}</span>
          <h1 id="ownerPrivateObjectTitle">${escapeHtml(item.title || `Объект №${item.id || objectId}`)}</h1>
          <p>${escapeHtml(item.district || "Бишкек")}${item.price ? ` · ${escapeHtml(item.price)}` : ""}</p>
          <div data-agent-object-workspace></div>
        </section>`;
    }
    const slot = document.querySelector("[data-agent-object-workspace]");
    if (!slot || !workspace) return;
    const claim = workspace.client_claim;
    slot.innerHTML = `
      <section class="agent-object-workspace" aria-labelledby="agentWorkspaceTitle">
        <div class="agent-workspace-heading">
          <div>
            <p class="crm-eyebrow">Обсуждение объекта</p>
            <h2 id="agentWorkspaceTitle">Вопросы и комментарии</h2>
          </div>
          ${workspace.role === "approved" ? '<a class="crm-cabinet-inline-link" href="/agent-cabinet.html">Открыть кабинет</a>' : ""}
        </div>

        ${workspace.role === "approved" ? `<div class="agent-workspace-grid">
          <section class="agent-note-panel" aria-labelledby="agentNoteTitle">
            <h3 id="agentNoteTitle">Моя заметка</h3>
            <p>Видна только вам.</p>
            <textarea rows="4" maxlength="3000" data-workspace-note placeholder="Клиент думает, перезвонить в пятницу">${escapeHtml(workspace.note?.note || "")}</textarea>
            <div class="agent-workspace-action-row">
              <span data-workspace-note-message aria-live="polite"></span>
              <button class="crm-primary-button crm-small-button" type="button" data-workspace-action="save-note">Сохранить</button>
            </div>
          </section>

          <section class="agent-client-panel" aria-labelledby="agentClientTitle">
            <h3 id="agentClientTitle">Клиент по объекту</h3>
            ${claim ? `
              <p class="agent-claim-active">Закреплено ${escapeHtml(formatDate(claim.created_at))}</p>
              <p>${escapeHtml(claim.client_label || "Без метки клиента")}</p>
              <button class="crm-secondary-button crm-small-button" type="button" data-workspace-action="release-client" data-claim-id="${escapeHtml(claim.claim_id)}">Снять закрепление</button>
            ` : `
              <label class="crm-field">
                <span>Инициалы или метка, без контактов</span>
                <input type="text" maxlength="80" data-workspace-client-label placeholder="Например: А.К.">
              </label>
              <button class="crm-primary-button" type="button" data-workspace-action="claim-client">Веду клиента по этому объекту</button>
              <p class="agent-workspace-hint">Зафиксируем точное время. Телефон и другие контакты не сохраняются.</p>
            `}
          </section>
        </div>` : ""}

        ${ownerEditorHtml()}

        ${workspace.role === "approved" && document.querySelector("#objectPage")?.dataset.recordKind !== "request" ? '<section class="agent-comments-panel agent-private-panel" data-private-object-panel aria-label="Закрытые данные объекта"></section>' : ""}

        <section class="agent-comments-panel" aria-labelledby="agentCommentsTitle">
          <div class="agent-comments-heading">
            <div>
              <div class="agent-comments-title-row">
                <h3 id="agentCommentsTitle">Обсуждение</h3>
                <span class="agent-comments-privacy">Только после регистрации</span>
              </div>
              <p>Задайте вопрос или поделитесь полезной информацией. Не публикуйте личные контакты.</p>
            </div>
          </div>
          <div class="agent-comments-list" data-workspace-comments>${commentsHtml(workspace.comments || [])}</div>
          <form class="agent-comment-form" data-workspace-comment-form>
            <label class="sr-only" for="agentCommentText">Добавить комментарий</label>
            <textarea id="agentCommentText" rows="3" maxlength="500" required placeholder="Например: объект ещё актуален? Можно ли посмотреть его в субботу?"></textarea>
            <div class="agent-comment-form-meta">
              <span data-workspace-comment-message aria-live="polite"></span>
              <span data-workspace-comment-count>0 / 500</span>
            </div>
            <button class="crm-primary-button crm-small-button" type="submit" disabled>Отправить</button>
          </form>
        </section>
      </section>
    `;
    if (workspace.can_edit_object && !document.querySelector("[data-workspace-action='open-owner-editor']")) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "card-action primary owner-edit-jump";
      editButton.dataset.workspaceAction = "open-owner-editor";
      editButton.textContent = "Редактировать объявление";
      document.querySelector(".object-info .object-tags")?.insertAdjacentElement("afterend", editButton);
    }
    updateCommentFormState(slot.querySelector("[data-workspace-comment-form]"));
    initOwnerLocationMap();
    loadPrivatePanel();
  }

  function workspaceSlot(create = false) {
    let slot = document.querySelector("[data-agent-object-workspace]");
    if (!slot && create && objectId) {
      const page = document.querySelector("#objectPage");
      if (page) {
        page.insertAdjacentHTML("beforeend", '<div data-agent-object-workspace></div>');
        slot = page.querySelector("[data-agent-object-workspace]");
      }
    }
    return slot;
  }

  function renderWorkspaceStatus(state) {
    const slot = workspaceSlot(true);
    if (!slot || !hasWorkspaceSession()) return;

    const isError = state === "error";
    slot.innerHTML = `
      <section class="agent-workspace-status" aria-live="polite">
        <div class="agent-workspace-status-card${isError ? " agent-workspace-status-error" : ""}">
          <div class="agent-workspace-status-head">
            <div>
              <p class="crm-eyebrow">Обсуждение объекта</p>
              <h3>Вопросы и комментарии</h3>
            </div>
            <span class="crm-private-badge">После регистрации</span>
          </div>
          <p>${isError ? "Не удалось загрузить рабочую зону." : "Загружаем рабочую зону..."}</p>
          ${
            isError
              ? `<div class="agent-workspace-status-actions">
                  <button class="crm-secondary-button crm-small-button" type="button" data-workspace-action="retry-workspace">
                    Повторить
                  </button>
                </div>`
              : ""
          }
        </div>
      </section>
    `;
  }

  function hasWorkspaceSession() {
    return Boolean(window.LiberterraAgentAccess?.hasUserSession()
      || window.LiberterraUserAccess?.isRegistered?.());
  }

  async function loadWorkspace({ force = false } = {}) {
    const slot = workspaceSlot(true);
    if (!slot) return;

    if (!hasWorkspaceSession()) {
      workspace = null;
      slot.innerHTML = "";
      return;
    }
    if (!objectId || slot.dataset.loading === "true" || (!force && workspace && loadedObjectId === objectId)) return;

    slot.dataset.loading = "true";
    slot.setAttribute("aria-busy", "true");
    if (!workspace || force) {
      renderWorkspaceStatus("loading");
    }
    try {
      workspace = await window.LiberterraAgentAccess.request("get_agent_object_workspace", {
        object_id: objectId,
      });
      loadedObjectId = objectId;
      workspaceRetryCount = 0;
      renderWorkspace();
    } catch (error) {
      workspace = null;
      loadedObjectId = "";
      const canRetry = !["registration_required", "object_access_denied", "access_denied"].includes(error?.code)
        && workspaceRetryCount < 2;
      if (canRetry) {
        workspaceRetryCount += 1;
        renderWorkspaceStatus("loading");
        window.setTimeout(() => loadWorkspace({ force: true }), 1500 * workspaceRetryCount);
      } else {
        renderWorkspaceStatus("error");
      }
    } finally {
      slot.dataset.loading = "false";
      slot.removeAttribute("aria-busy");
    }
  }

  async function refreshWorkspace() {
    workspace = await window.LiberterraAgentAccess.request("get_agent_object_workspace", {
      object_id: objectId,
    });
    loadedObjectId = objectId;
    renderWorkspace();
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-workspace-action]");
    if (!button || !objectId) return;
    const action = button.dataset.workspaceAction;
    if (action === "retry-workspace") {
      workspaceRetryCount = 0;
      loadWorkspace({ force: true });
      return;
    }
    button.disabled = true;
    try {
      if (action === "open-owner-editor") {
        document.querySelector(".owner-edit-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        button.disabled = false;
        return;
      }
      if (action === "clear-owner-location") {
        const form = button.closest("form");
        form.querySelector('[name="latitude"]').value = "";
        form.querySelector('[name="longitude"]').value = "";
        if (ownerLocationMarker && ownerLocationMap) ownerLocationMap.removeLayer(ownerLocationMarker);
        ownerLocationMarker = null;
        form.querySelector("[data-owner-location-status]").textContent = "Точка удалена";
        button.hidden = true;
        button.disabled = false;
        return;
      }
      if (action === "save-note") {
        const message = document.querySelector("[data-workspace-note-message]");
        message.textContent = "Сохраняем...";
        const response = await window.LiberterraAgentAccess.request("save_agent_note", {
          object_id: objectId,
          note: document.querySelector("[data-workspace-note]").value,
        });
        workspace.note = response.note;
        message.textContent = "Сохранено";
        button.disabled = false;
        return;
      }
      if (action === "reload-private-data") {
        await loadPrivatePanel();
        button.disabled = false;
        return;
      }
      if (action === "download-private-document") {
        const result = await window.LiberterraAgentAccess.request("download_agent_private_document", { object_id: objectId, document_id: button.dataset.documentId });
        const binary = Uint8Array.from(atob(result.file_base64), (char) => char.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([binary], { type: result.mime_type || "application/octet-stream" }));
        const link = document.createElement("a"); link.href = url; link.download = result.name || "document"; link.click(); URL.revokeObjectURL(url);
        button.disabled = false;
        return;
      }
      if (action === "approve-private-request" || action === "deny-private-request") {
        const requestId = button.dataset.requestId;
        const granted = [...document.querySelectorAll(`[data-request-id="${CSS.escape(requestId)}"][data-grant-scope]:checked`)].map((input) => input.dataset.grantScope);
        await window.LiberterraAgentAccess.request("decide_agent_private_access", { request_id: requestId, decision: action === "approve-private-request" ? "approve" : "deny", granted_scopes: granted });
        await loadPrivatePanel();
        return;
      }
      if (action === "revoke-private-access") {
        await window.LiberterraAgentAccess.request("revoke_agent_private_access", { request_id: button.dataset.requestId });
        await loadPrivatePanel();
        return;
      }
      if (action === "claim-client") {
        const label = document.querySelector("[data-workspace-client-label]").value;
        await window.LiberterraAgentAccess.request("claim_agent_client", {
          object_id: objectId,
          client_label: label,
        });
        await refreshWorkspace();
      }
      if (action === "release-client") {
        await window.LiberterraAgentAccess.request("release_agent_client", {
          claim_id: button.dataset.claimId,
        });
        await refreshWorkspace();
      }
      if (action === "delete-object") {
        if (!window.confirm("Удалить объявление из каталога? Его можно будет восстановить через администратора.")) {
          button.disabled = false;
          return;
        }
        await window.LiberterraAgentAccess.request("update_agent_object", {
          object_id: objectId,
          changes: { status: "снят" },
        });
        window.alert("Объявление архивировано");
        if (window.history.length > 1) window.history.back();
        else window.location.href = "/my-listings.html";
        return;
      }
      if (action === "delete-comment") {
        if (!window.confirm("Удалить комментарий?")) {
          button.disabled = false;
          return;
        }
        const comment = button.closest("[data-comment-id]");
        await window.LiberterraAgentAccess.request("delete_agent_comment", {
          comment_id: comment.dataset.commentId,
        });
        await refreshWorkspace();
      }
      if (action === "report-comment") {
        const comment = button.closest("[data-comment-id]");
        await window.LiberterraAgentAccess.request("report_comment", { comment_id: comment.dataset.commentId });
        button.textContent = "Жалоба отправлена";
        return;
      }
      if (action === "edit-comment") {
        const comment = button.closest("[data-comment-id]");
        const commentText = comment.querySelector("[data-comment-text]");
        const original = commentText.textContent;
        commentText.innerHTML = `
          <textarea class="agent-comment-edit" rows="3" maxlength="500">${escapeHtml(original)}</textarea>
          <span class="agent-comment-edit-actions">
            <button type="button" data-workspace-action="cancel-comment-edit">Отмена</button>
            <button type="button" data-workspace-action="save-comment-edit">Сохранить</button>
          </span>
        `;
        commentText.querySelector("textarea").focus();
        button.disabled = false;
      }
      if (action === "cancel-comment-edit") {
        await refreshWorkspace();
      }
      if (action === "save-comment-edit") {
        const comment = button.closest("[data-comment-id]");
        const value = comment.querySelector("textarea").value.trim();
        if (!value || value.length > COMMENT_LIMIT) {
          throw new Error(!value
            ? COMMENT_ERROR_MESSAGES.comment_required
            : COMMENT_ERROR_MESSAGES.comment_too_long);
        }
        await window.LiberterraAgentAccess.request("update_agent_comment", {
          comment_id: comment.dataset.commentId,
          text: value,
        });
        await refreshWorkspace();
      }
    } catch (error) {
      button.disabled = false;
      window.alert(error.code === "client_label_contacts_not_allowed"
        ? "Укажите только инициалы или метку клиента, без телефона и контактов."
        : commentErrorMessage(error));
    }
  });

  document.addEventListener("input", (event) => {
    const form = event.target.closest("[data-workspace-comment-form]");
    if (form) updateCommentFormState(form);
  });
  document.addEventListener("change", (event) => {
    const input = event.target.closest('[name="new_photos"]');
    if (!input) return;
    const list = input.closest(".owner-photo-upload")?.querySelector("[data-new-photo-list]");
    if (list) list.textContent = input.files?.length
      ? [...input.files].map((file) => file.name).join(", ")
      : "Файлы не выбраны";
  });

  document.addEventListener("submit", async (event) => {
    const privateForm = event.target.closest("[data-private-object-form]");
    if (privateForm) {
      event.preventDefault();
      const formData = new FormData(privateForm);
      const message = privateForm.querySelector("[data-private-message]");
      try {
        await window.LiberterraAgentAccess.request("save_agent_private_object", { object_id: objectId, data: Object.fromEntries(formData.entries()) });
        message.textContent = "Закрытые данные сохранены.";
      } catch (error) { message.textContent = commentErrorMessage(error); }
      return;
    }
    const privateUploadForm = event.target.closest("[data-private-upload-form]");
    if (privateUploadForm) {
      event.preventDefault();
      const file = privateUploadForm.querySelector('[name="file"]').files?.[0];
      const message = privateUploadForm.querySelector("[data-private-message]");
      if (!file) return;
      if (file.size > 5 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) { window.alert("Допустимы PDF, JPG, PNG размером до 5 МБ."); return; }
      const uploadButton = privateUploadForm.querySelector('button[type="submit"]');
      if (uploadButton) uploadButton.disabled = true;
      try {
        const encoded = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = reject; reader.readAsDataURL(file); });
        await window.LiberterraAgentAccess.request("upload_agent_private_document", { object_id: objectId, category: privateUploadForm.elements.category.value, file_name: file.name, file_type: file.type, file_base64: encoded });
        await loadPrivatePanel();
      } catch (error) { window.alert(commentErrorMessage(error)); if (uploadButton) uploadButton.disabled = false; }
      return;
    }
    const privateRequestForm = event.target.closest("[data-private-request-form]");
    if (privateRequestForm) {
      event.preventDefault();
      const scopes = [...privateRequestForm.querySelectorAll('[name="scope"]:checked')].map((input) => input.value);
      const message = privateRequestForm.querySelector("[data-private-message]");
      if (!scopes.length) { message.textContent = "Выберите хотя бы одну категорию."; return; }
      try {
        await window.LiberterraAgentAccess.request("request_agent_private_access", { object_id: objectId, requested_scopes: scopes });
        await loadPrivatePanel();
      } catch (error) { message.textContent = commentErrorMessage(error); }
      return;
    }
    const ownerForm = event.target.closest("[data-owner-edit-form]");
    if (ownerForm) {
      event.preventDefault();
      const button = ownerForm.querySelector('[type="submit"]');
      const message = ownerForm.querySelector("[data-owner-edit-message]");
      const data = new FormData(ownerForm);
      const keptPhotos = data.getAll("keep_photo").map(text).filter(Boolean);
      const newPhotos = [...(ownerForm.querySelector('[name="new_photos"]')?.files || [])];
      if (keptPhotos.length + newPhotos.length < 1) {
        message.textContent = "Оставьте или добавьте хотя бы одну фотографию.";
        return;
      }
      if (keptPhotos.length + newPhotos.length > 5) {
        message.textContent = "В объявлении может быть не больше 5 фотографий.";
        return;
      }
      button.disabled = true;
      message.textContent = "Сохраняем...";
      try {
        const uploadedPhotos = [];
        if (newPhotos.length) {
          message.textContent = "Загружаем новые фотографии...";
          const uploadData = new FormData();
          uploadData.set("telegram_init_data", window.Telegram?.WebApp?.initData || "");
          uploadData.set("object_id", objectId);
          uploadData.set("existing_count", String(keptPhotos.length));
          newPhotos.forEach((file) => uploadData.append("photos", file, file.name));
          const uploadResponse = await fetch("/api/object-photos", { method: "POST", body: uploadData });
          const uploadResult = await uploadResponse.json().catch(() => ({}));
          if (!uploadResponse.ok || uploadResult.ok !== true) throw new Error(uploadResult.error || "Не удалось загрузить фотографии.");
          uploadedPhotos.push(...(uploadResult.urls || []));
        }
        const updateResult = await window.LiberterraAgentAccess.request("update_agent_object", {
          object_id: objectId,
          changes: {
            title: data.get("title"), price: data.get("price"), district: data.get("district"),
            rooms: data.get("rooms"), area: data.get("area"), floor: data.get("floor"),
            description: data.get("description"), photo_url: [...keptPhotos, ...uploadedPhotos].join(" | "),
            latitude: data.get("latitude"), longitude: data.get("longitude"),
          },
        });
        await window.LiberterraAgentAccess.ensureModerationNotification(objectId, updateResult);
        message.textContent = "Изменения отправлены на повторную проверку.";
        await refreshWorkspace();
      } catch (error) {
        message.textContent = commentErrorMessage(error);
      } finally {
        button.disabled = false;
      }
      return;
    }
    const form = event.target.closest("[data-workspace-comment-form]");
    if (!form) return;
    event.preventDefault();
    const message = form.querySelector("[data-workspace-comment-message]");
    const submit = form.querySelector('[type="submit"]');
    const textarea = form.querySelector("textarea");
    const value = textarea.value.trim();
    if (!value || value.length > COMMENT_LIMIT) {
      message.textContent = !value
        ? COMMENT_ERROR_MESSAGES.comment_required
        : COMMENT_ERROR_MESSAGES.comment_too_long;
      updateCommentFormState(form);
      return;
    }
    form.dataset.sending = "true";
    updateCommentFormState(form);
    message.textContent = "Отправляем...";
    try {
      await window.LiberterraAgentAccess.request("add_agent_comment", {
        object_id: objectId,
        text: value,
      });
      await refreshWorkspace();
    } catch (error) {
      message.textContent = commentErrorMessage(error);
      form.dataset.sending = "false";
      updateCommentFormState(form);
    }
  });

  window.addEventListener("liberterra:object-rendered", (event) => {
    objectId = text(event.detail?.objectId) || objectId;
    renderPublicAgent();
    loadWorkspace();
  });
  window.addEventListener("liberterra:agent-role", () => loadWorkspace());
  window.addEventListener("liberterra:user-registered", () => loadWorkspace({ force: true }));
  window.setTimeout(() => {
    renderPublicAgent();
    loadWorkspace();
  }, 0);
})();
