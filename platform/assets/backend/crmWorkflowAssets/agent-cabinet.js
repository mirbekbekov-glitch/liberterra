(() => {
  "use strict";

  const root = document.querySelector("#agentCabinet");
  if (!root) return;

  const headerRow = document.querySelector(".crm-header-inner");
  if (headerRow && !headerRow.querySelector(".crm-theme-toggle")) {
    const themeButton = document.createElement("button");
    themeButton.type = "button";
    themeButton.className = "v20-theme-toggle crm-theme-toggle";
    let savedTheme = "";
    try { savedTheme = localStorage.getItem("v20-public-theme") || ""; } catch (_) {}
    let theme = ["light", "dark"].includes(savedTheme)
      ? savedTheme : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const applyTheme = () => {
      document.body.dataset.publicTheme = theme;
      themeButton.textContent = theme === "dark" ? "Светлая тема" : "Тёмная тема";
      themeButton.setAttribute("aria-label", themeButton.textContent);
    };
    themeButton.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("v20-public-theme", theme); } catch (_) {}
      applyTheme();
    });
    headerRow.querySelector(".crm-catalog-link")?.before(themeButton);
    applyTheme();
  }

  const loading = root.querySelector("[data-crm-loading]");
  const content = root.querySelector("[data-crm-content]");
  const dialog = document.querySelector("[data-crm-edit-dialog]");
  const editForm = dialog?.querySelector("[data-crm-edit-form]");
  const state = { dashboard: null, activeTab: "objects", privateAccess: null };
  const privateScopeLabels = {
    owner_contact: "Контакты собственника", legal_docs: "Правоустанавливающие документы",
    owner_contract: "Договор с собственником", other_docs: "Другие документы", work_notes: "Рабочая информация",
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

  const text = (value) => String(value ?? "").trim();
  const sameId = (left, right) => text(left) === text(right);
  const isTrue = (value) => value === true || ["true", "1", "yes", "да", "проверен", "проверено"].includes(text(value).toLowerCase());
  const statusKey = (value) => {
    const current = text(value).toLowerCase().replace(/ё/g, "е");
    if (["опубликован", "published", "active", "активен"].includes(current)) return "active";
    if (["снят", "снято", "removed", "архив", "archive", "неактуален"].includes(current)) return "removed";
    return "moderation";
  };
  const statusLabel = (value) => ({
    active: "Активен",
    moderation: "На модерации",
    removed: "Снят",
  })[statusKey(value)];
  const specializationLabel = (value) => value === "sale" ? "Продажа" : "Аренда";
  const photoCandidates = (value) => {
    const candidates = [];
    for (const source of text(value).split(/[|\s]+/).filter(Boolean).slice(0, 12)) {
      try {
        const url = new URL(source, window.location.origin);
        if (!/^https?:$/.test(url.protocol)) continue;
        const internal = [window.location.hostname, "hidden-pine-cbff.mirbekbekov.workers.dev", "liberterra-kg-catalog.pages.dev"].includes(url.hostname);
        if (internal && /^\/uploads\/object_[^/]+\.(?:jpe?g|png|webp)$/i.test(url.pathname)) {
          candidates.push("https://hidden-pine-cbff.mirbekbekov.workers.dev" + url.pathname);
          candidates.push(window.location.origin + url.pathname);
        } else if (/^https?:\/\//i.test(source) && url.pathname !== "/") candidates.push(url.href);
      } catch (_) { /* Ignore malformed or truncated photo links. */ }
    }
    return [...new Set(candidates)];
  };
  root.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.classList.contains("crm-object-photo")) return;
    let candidates = [];
    try { candidates = JSON.parse(image.dataset.photoCandidates || "[]"); } catch (_) {}
    const next = Number(image.dataset.photoIndex || 0) + 1;
    image.dataset.photoIndex = String(next);
    if (next < candidates.length) { image.src = candidates[next]; return; }
    image.hidden = true;
    const label = document.createElement("span");
    label.className = "crm-photo-unavailable";
    label.textContent = "Фото временно недоступно";
    if (!image.parentElement.querySelector(".crm-photo-unavailable")) image.parentElement.append(label);
  }, true);
  const formatDate = (value) => {
    if (!text(value)) return "дата не указана";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? text(value)
      : new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  };
  const objectLabel = (item) => text(item?.title) || text(item?.district) || `Объект ${text(item?.id)}`;
  const priceLabel = (item) => {
    const amount = text(item?.price) || "Цена по запросу";
    return item?.per ? `${amount} / ${text(item.per).replace(/^\/+\s*/, "")}` : amount;
  };
  const noteFor = (objectId) => state.dashboard?.notes?.find((note) => sameId(note.object_id, objectId));

  function emptyState(title, body) {
    return `<div class="crm-empty"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></div>`;
  }

  function counterHtml(label, value, tone) {
    return `
      <div class="crm-counter crm-counter-${tone}">
        <strong>${Number(value) || 0}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `;
  }

  function objectCard(item) {
    const currentStatus = statusKey(item.status);
    const actualAt = item.actuality_at || item.updated_at;
    const photos = photoCandidates(item.photo_url);
    const facts = [text(item.deal), text(item.area) && `Площадь: ${text(item.area)}${/[мm]/i.test(text(item.area)) ? "" : " м²"}`, text(item.rooms) && `Комнат: ${text(item.rooms)}`, text(item.floor) && `Этаж: ${text(item.floor)}`].filter(Boolean);
    return `
      <article class="crm-object-card" data-crm-object-id="${escapeHtml(item.id)}">
        <a class="crm-object-photo-link" href="/object.html?id=${encodeURIComponent(item.id)}" aria-label="Открыть ${escapeHtml(objectLabel(item))}">
          ${photos.length ? `<img class="crm-object-photo" src="${escapeHtml(photos[0])}" data-photo-candidates="${escapeHtml(JSON.stringify(photos))}" data-photo-index="0" alt="${escapeHtml(objectLabel(item))}" loading="lazy">` : '<span class="crm-photo-unavailable">Нет фотографий</span>'}
        </a>
        <div class="crm-object-copy">
          <div class="crm-object-topline">
            <span class="crm-status crm-status-${currentStatus}">${escapeHtml(statusLabel(item.status))}</span>
            <span class="crm-review-badge">${isTrue(item.verified) ? "Проверен" : "На модерации"}</span>
          </div>
          <h3><a href="/object.html?id=${encodeURIComponent(item.id)}">${escapeHtml(objectLabel(item))}</a></h3>
          <p class="crm-object-location">${escapeHtml(item.district || "Район не указан")}</p>
          ${facts.length ? `<p class="crm-object-facts">${facts.map(value => `<span>${escapeHtml(value)}</span>`).join("")}</p>` : ""}
          ${text(item.description) ? `<p class="crm-object-description">${escapeHtml(text(item.description))}</p>` : ""}
          <strong class="crm-object-price">${escapeHtml(priceLabel(item))}</strong>
          <p class="crm-actuality">Актуально на ${escapeHtml(formatDate(actualAt))}</p>
          <div class="crm-object-actions">
            <button class="crm-text-button" type="button" data-crm-workflow-action="selection" data-object-id="${escapeHtml(item.id)}">В подборку</button>
            <button class="crm-text-button" type="button" data-crm-workflow-action="task" data-object-id="${escapeHtml(item.id)}">Создать задачу</button>
            <button class="crm-text-button" type="button" data-crm-action="price" data-object-id="${escapeHtml(item.id)}">Изменить цену</button>
            <button class="crm-text-button" type="button" data-crm-action="edit" data-object-id="${escapeHtml(item.id)}">Редактировать</button>
            <label class="crm-status-control">
              <span class="sr-only">Статус объекта</span>
              <select data-crm-status-select="${escapeHtml(item.id)}">
                <option value="active"${currentStatus === "active" ? " selected" : ""}>Активен</option>
                <option value="moderation"${currentStatus === "moderation" ? " selected" : ""}>На модерации</option>
                <option value="removed"${currentStatus === "removed" ? " selected" : ""}>Снят</option>
              </select>
              <button class="crm-icon-action" type="button" data-crm-action="status" data-object-id="${escapeHtml(item.id)}" title="Сохранить статус" aria-label="Сохранить статус">✓</button>
            </label>
          </div>
        </div>
      </article>
    `;
  }

  function noteCard(item) {
    const note = noteFor(item.id);
    return `
      <article class="crm-note-item" data-note-object-id="${escapeHtml(item.id)}">
        <div class="crm-note-heading">
          <div>
            <h3><a href="/object.html?id=${encodeURIComponent(item.id)}">${escapeHtml(objectLabel(item))}</a></h3>
            <p>${escapeHtml(item.district || "Район не указан")}</p>
          </div>
          <span>${note?.updated_at ? `Обновлено ${escapeHtml(formatDate(note.updated_at))}` : "Новая заметка"}</span>
        </div>
        <textarea class="crm-note-input" rows="4" maxlength="3000" placeholder="Например: перезвонить в пятницу" aria-label="Моя заметка по объекту">${escapeHtml(note?.note || "")}</textarea>
        <div class="crm-note-actions">
          <span class="crm-inline-message" data-note-message aria-live="polite"></span>
          <button class="crm-primary-button crm-small-button" type="button" data-crm-action="save-note" data-object-id="${escapeHtml(item.id)}">Сохранить заметку</button>
        </div>
      </article>
    `;
  }

  function clientCard(client) {
    const item = client.object || {};
    return `
      <article class="crm-client-item">
        <div>
          <p class="crm-eyebrow">Закреплено ${escapeHtml(formatDate(client.created_at))}</p>
          <h3><a href="/object.html?id=${encodeURIComponent(client.object_id)}">${escapeHtml(objectLabel(item))}</a></h3>
          <p>${escapeHtml(client.client_label || "Клиент без метки")}</p>
        </div>
        <button class="crm-secondary-button crm-small-button" type="button" data-crm-action="release-client" data-claim-id="${escapeHtml(client.claim_id)}">Снять закрепление</button>
      </article>
    `;
  }

  function privateAccessCard(request, incoming) {
    const scopes = request.status === "approved" ? request.granted_scopes : request.requested_scopes;
    const object = state.dashboard?.objects.find((item) => sameId(item.id, request.object_id));
    const objectName = object ? objectLabel(object) : `Объект ${request.object_id}`;
    return `<article class="crm-private-access-item"><div><p class="crm-eyebrow">${incoming ? "Входящий запрос" : "Мой запрос"} · ${escapeHtml(objectName)}</p><h3>${escapeHtml(incoming ? request.requester_name || "Агент Liberterra" : request.status === "pending" ? "Ожидает решения" : request.status === "approved" ? "Одобрен" : request.status === "denied" ? "Отклонён" : "Отозван")}</h3><p>${escapeHtml((scopes || []).map((scope) => privateScopeLabels[scope] || scope).join(", ") || "Категории не выбраны")}</p></div>${incoming && request.status === "pending" ? `<div class="crm-private-scope-choices">${request.requested_scopes.map((scope) => `<label><input type="checkbox" data-private-scope="${escapeHtml(scope)}" data-request-id="${escapeHtml(request.request_id)}" checked> ${escapeHtml(privateScopeLabels[scope] || scope)}</label>`).join("")}</div><div class="crm-private-access-actions"><button class="crm-primary-button crm-small-button" type="button" data-crm-action="approve-private" data-request-id="${escapeHtml(request.request_id)}">Одобрить выбранное</button><button class="crm-secondary-button crm-small-button" type="button" data-crm-action="deny-private" data-request-id="${escapeHtml(request.request_id)}">Отклонить</button></div>` : incoming && request.status === "approved" ? `<button class="crm-secondary-button crm-small-button" type="button" data-crm-action="revoke-private" data-request-id="${escapeHtml(request.request_id)}">Отозвать доступ</button>` : ""}</article>`;
  }

  function renderPrivateAccess() {
    const slot = root.querySelector("[data-crm-private-access]");
    if (!slot || !state.privateAccess) return;
    const incoming = state.privateAccess.incoming || [];
    const outgoing = state.privateAccess.outgoing || [];
    slot.innerHTML = `${incoming.length ? `<h3>Запросы к моим объектам</h3>${incoming.map((request) => privateAccessCard(request, true)).join("")}` : emptyState("Входящих запросов нет", "Когда коллега запросит закрытые сведения по вашему объекту, решение появится здесь.")}${outgoing.length ? `<h3>Мои запросы коллегам</h3>${outgoing.map((request) => privateAccessCard(request, false)).join("")}` : ""}`;
  }

  async function loadPrivateAccess() {
    const slot = root.querySelector("[data-crm-private-access]");
    try {
      state.privateAccess = await window.LiberterraAgentAccess.request("list_agent_private_access", {});
      renderPrivateAccess();
    } catch (error) {
      if (slot) slot.innerHTML = `<div class="crm-empty"><strong>Не удалось загрузить запросы</strong><span>${escapeHtml(error.message)}</span><button class="crm-secondary-button crm-small-button" type="button" data-crm-action="reload-private-access">Повторить</button></div>`;
    }
  }

  function render() {
    const dashboard = state.dashboard;
    if (!dashboard) return;
    root.querySelector("[data-crm-agent-summary]").textContent =
      `${dashboard.agent.name} · ${specializationLabel(dashboard.agent.specialization)}`;
    const publicLink = root.querySelector("[data-crm-public-link]");
    if (dashboard.agent.public_ref) {
      publicLink.href = `/agent-public.html?agent=${encodeURIComponent(dashboard.agent.public_ref)}`;
      publicLink.hidden = false;
    }
    root.querySelector("[data-crm-counters]").innerHTML = [
      counterHtml("Активно", dashboard.counters.active, "active"),
      counterHtml("На модерации", dashboard.counters.moderation, "moderation"),
      counterHtml("Снято", dashboard.counters.removed, "removed"),
    ].join("");
    root.querySelector("[data-crm-objects]").innerHTML = dashboard.objects.length
      ? dashboard.objects.map(objectCard).join("")
      : emptyState("Объектов пока нет", "Разместите первый объект через бот Liberterra.");
    root.querySelector("[data-crm-clients]").innerHTML = dashboard.clients.length
      ? dashboard.clients.map(clientCard).join("")
      : emptyState("Нет закреплённых клиентов", "Откройте объект и нажмите «Веду клиента по этому объекту».");
    root.querySelector("[data-crm-notes]").innerHTML = dashboard.objects.length
      ? dashboard.objects.map(noteCard).join("")
      : emptyState("Заметок пока нет", "Заметки появятся вместе с вашими объектами.");
    renderPrivateAccess();
    window.LiberterraCrmWorkspace?.update(dashboard);
    window.LiberterraCrmWorkflow?.update(dashboard);
  }

  async function loadDashboard() {
    loading.hidden = false;
    loading.classList.remove("is-error");
    loading.textContent = "Проверяем доступ агента...";
    try {
      state.dashboard = await window.LiberterraAgentAccess.request("get_agent_dashboard");
      render();
      loading.hidden = true;
      content.hidden = false;
      loadPrivateAccess();
    } catch (error) {
      content.hidden = true;
      loading.hidden = false;
      loading.classList.add("is-error");
      loading.innerHTML = `
        <strong>Кабинет недоступен</strong>
        <span>${escapeHtml(error.message)}</span>
        <small>Код проверки: ${escapeHtml(error.code || "request_failed")}</small>
        <a href="https://t.me/Liberterra_kg_bot">Открыть бот Liberterra</a>
      `;
    }
  }

  function selectTab(nextTab) {
    state.activeTab = nextTab;
    root.querySelectorAll("[data-crm-tab]").forEach((tab) => {
      const active = tab.dataset.crmTab === nextTab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    root.querySelectorAll("[data-crm-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.crmPanel !== nextTab;
    });
  }

  function openEditor(item, priceOnly = false) {
    if (!dialog || !editForm) return;
    editForm.elements.object_id.value = item.id;
    editForm.elements.price.value = item.price || "";
    editForm.elements.title.value = item.title || "";
    editForm.elements.district.value = item.district || "";
    editForm.elements.description.value = item.description || "";
    ["title", "district", "description"].forEach((name) => {
      editForm.elements[name].closest(".crm-field").hidden = priceOnly;
    });
    dialog.querySelector("#crmEditTitle").textContent = priceOnly ? "Изменить цену" : "Редактировать объект";
    dialog.showModal();
    window.setTimeout(() => editForm.elements[priceOnly ? "price" : "title"].focus(), 0);
  }

  async function updateObject(objectId, changes, messageTarget) {
    if (messageTarget) messageTarget.textContent = "Сохраняем...";
    const response = await window.LiberterraAgentAccess.request("update_agent_object", {
      object_id: objectId,
      changes,
    });
    if (response?.object && String(response.object.status || "").trim().toLowerCase() === "на модерации") {
      await window.LiberterraAgentAccess.ensureModerationNotification(objectId, response);
    }
    const index = state.dashboard.objects.findIndex((item) => sameId(item.id, objectId));
    if (index !== -1) state.dashboard.objects[index] = response.object;
    state.dashboard.counters = { active: 0, moderation: 0, removed: 0 };
    state.dashboard.objects.forEach((item) => {
      state.dashboard.counters[statusKey(item.status)] += 1;
    });
    render();
  }

  root.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-crm-tab]");
    if (tab) {
      selectTab(tab.dataset.crmTab);
      return;
    }
    const actionButton = event.target.closest("[data-crm-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.crmAction;
    const objectId = actionButton.dataset.objectId;
    const item = state.dashboard?.objects.find((object) => sameId(object.id, objectId));
    try {
      if (action === "price" && item) openEditor(item, true);
      if (action === "edit" && item) openEditor(item, false);
      if (action === "status" && item) {
        const card = actionButton.closest("[data-crm-object-id]");
        const select = card?.querySelector("[data-crm-status-select]");
        if (!select) throw new Error("Не удалось найти статус объекта.");
        actionButton.disabled = true;
        await updateObject(objectId, { status: select.value });
      }
      if (action === "save-note") {
        const card = actionButton.closest("[data-note-object-id]");
        const message = card.querySelector("[data-note-message]");
        actionButton.disabled = true;
        message.textContent = "Сохраняем...";
        const response = await window.LiberterraAgentAccess.request("save_agent_note", {
          object_id: objectId,
          note: card.querySelector("textarea").value,
        });
        const current = state.dashboard.notes.find((note) => sameId(note.object_id, objectId));
        if (current) Object.assign(current, response.note);
        else state.dashboard.notes.push({ object_id: objectId, ...response.note });
        message.textContent = "Сохранено";
        actionButton.disabled = false;
      }
      if (action === "release-client") {
        actionButton.disabled = true;
        await window.LiberterraAgentAccess.request("release_agent_client", {
          claim_id: actionButton.dataset.claimId,
        });
        await loadDashboard();
        selectTab("clients");
      }
      if (action === "reload-private-access") await loadPrivateAccess();
      if (["approve-private", "deny-private"].includes(action)) {
        const requestId = actionButton.dataset.requestId;
        const grantedScopes = [...root.querySelectorAll("[data-request-id][data-private-scope]:checked")].filter((input) => input.dataset.requestId === requestId).map((input) => input.dataset.privateScope);
        await window.LiberterraAgentAccess.request("decide_agent_private_access", {
          request_id: requestId,
          decision: action === "approve-private" ? "approve" : "deny",
          granted_scopes: grantedScopes,
        });
        await loadPrivateAccess();
      }
      if (action === "revoke-private") {
        await window.LiberterraAgentAccess.request("revoke_agent_private_access", { request_id: actionButton.dataset.requestId });
        await loadPrivateAccess();
      }
    } catch (error) {
      actionButton.disabled = false;
      window.alert(error.code === "contract_not_verified"
        ? "Публикация станет доступна после проверки договора администратором."
        : error.message);
    }
  });

  editForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = editForm.querySelector("[data-crm-edit-message]");
    const submit = editForm.querySelector('[type="submit"]');
    const objectId = editForm.elements.object_id.value;
    const priceOnly = editForm.elements.title.closest(".crm-field").hidden;
    const changes = priceOnly
      ? { price: editForm.elements.price.value }
      : {
          price: editForm.elements.price.value,
          title: editForm.elements.title.value,
          district: editForm.elements.district.value,
          description: editForm.elements.description.value,
        };
    submit.disabled = true;
    message.hidden = false;
    message.textContent = "Сохраняем...";
    try {
      await updateObject(objectId, changes);
      dialog.close();
      message.hidden = true;
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelectorAll("[data-crm-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => dialog?.close());
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  loadDashboard();
})();
