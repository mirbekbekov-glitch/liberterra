(() => {
  "use strict";
  const API = "/api/messages";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
  const telegramPayload = () => {
    const tg = window.Telegram?.WebApp;
    return tg?.initData && tg?.initDataUnsafe?.user?.id ? { init_data: tg.initData } : {};
  };
  async function api(action, data = {}) {
    const response = await fetch(API, {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data, ...telegramPayload() }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) {
      const error = new Error(result.error || "message_service_unavailable");
      error.code = result.error || "message_service_unavailable";
      throw error;
    }
    return result;
  }

  function addHeaderControl() {
    const controls = document.querySelector(".lt-header-row .header-controls, .lt-header-row .header-utility-controls, .header-controls");
    if (!controls || controls.querySelector("[data-liberterra-messages]")) return;
    const link = document.createElement("a");
    link.href = "/messages.html";
    link.className = "header-messages";
    link.dataset.liberterraMessages = "true";
    link.setAttribute("aria-label", "Сообщения");
    link.title = "Сообщения";
    link.innerHTML = '<span aria-hidden="true">▢</span><b data-message-badge hidden>0</b>';
    controls.prepend(link);
  }

  async function refreshBadge() {
    const badge = document.querySelector("[data-message-badge]");
    if (!badge) return;
    try {
      const result = await api("list_message_threads");
      const count = Number(result.unread_count || 0);
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count < 1;
    } catch (_) {
      badge.hidden = true;
    }
  }

  async function openThreadFromObject(button) {
    const objectId = button.dataset.objectId;
    if (!objectId) return;
    button.disabled = true;
    try {
      const result = await api("open_message_thread", { object_id: objectId });
      location.href = `/messages.html?thread=${encodeURIComponent(result.thread.thread_id)}`;
    } catch (error) {
      if (error.code === "registration_required" && window.LiberterraUserAccess?.require) {
        await window.LiberterraUserAccess.require();
        button.disabled = false;
        return;
      }
      button.disabled = false;
      button.textContent = error.code === "agent_unavailable" ? "Агент пока недоступен" : "Войдите, чтобы написать";
    }
  }

  function addObjectAction(objectId) {
    const actions = document.querySelector(".object-actions");
    if (!actions || actions.querySelector("[data-contact-whatsapp]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card-action primary object-message-action";
    button.dataset.contactGate = objectId;
    button.dataset.contactWhatsapp = objectId;
    button.textContent = "WhatsApp";
    actions.prepend(button);
  }

  function renderThreads(state) {
    const list = state.root.querySelector("[data-message-threads]");
    list.innerHTML = state.threads.length ? state.threads.map((thread) => `
      <button type="button" class="message-thread${thread.thread_id === state.activeId ? " is-active" : ""}" data-thread-id="${esc(thread.thread_id)}">
        <span class="message-thread-title">${esc(thread.object_title)}</span>
        <small>${esc(thread.agent_name)} · ${esc(thread.last_message || "Новый диалог")}</small>
        ${thread.unread_count ? `<b>${thread.unread_count > 99 ? "99+" : thread.unread_count}</b>` : ""}
      </button>`).join("") : '<p class="messages-empty">Пока нет диалогов. Откройте объект и нажмите «Написать агенту».</p>';
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString("ru-RU", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "";
  }

  async function showThread(state, threadId) {
    state.activeId = threadId;
    renderThreads(state);
    const pane = state.root.querySelector("[data-message-pane]");
    pane.innerHTML = '<p class="messages-loading">Загружаем переписку…</p>';
    try {
      const result = await api("read_message_thread", { thread_id: threadId });
      state.messages = result.messages || [];
      const thread = result.thread || state.threads.find((item) => item.thread_id === threadId);
      pane.innerHTML = `
        <div class="messages-pane-head"><div><h1>${esc(thread?.object_title || "Диалог")}</h1><p>Диалог с ${esc(thread?.agent_name || "агентом Liberterra")}</p></div><a href="/object.html?id=${encodeURIComponent(thread?.object_id || "")}">К объекту</a></div>
        <div class="messages-stream" data-message-stream>${state.messages.length ? state.messages.map((message) => `<article class="message-bubble${message.mine ? " mine" : ""}"><p>${esc(message.text).replace(/\n/g, "<br>")}</p><small>${esc(message.sender_name)} · ${esc(formatDate(message.created_at))}</small></article>`).join("") : '<p class="messages-empty">Напишите первое сообщение агенту.</p>'}</div>
        <form class="messages-compose" data-message-form><textarea name="text" maxlength="1200" required placeholder="Напишите сообщение…" aria-label="Текст сообщения"></textarea><button type="submit">Отправить</button></form>`;
      pane.querySelector("[data-message-stream]")?.scrollTo({ top: 999999, behavior: "instant" });
    } catch (_) {
      pane.innerHTML = '<p class="messages-empty">Не удалось открыть диалог. Обновите страницу и попробуйте снова.</p>';
    }
  }

  async function mountMessagesPage() {
    const root = document.querySelector("[data-messages-app]");
    if (!root) return;
    const state = { root, threads: [], activeId: new URLSearchParams(location.search).get("thread") || "" };
    try {
      const result = await api("list_message_threads");
      state.threads = result.threads || [];
      if (!state.activeId || !state.threads.some((item) => item.thread_id === state.activeId)) state.activeId = state.threads[0]?.thread_id || "";
      renderThreads(state);
      if (state.activeId) await showThread(state, state.activeId);
      else root.querySelector("[data-message-pane]").innerHTML = '<p class="messages-empty">Выберите диалог или откройте карточку объекта, чтобы написать агенту.</p>';
    } catch (error) {
      root.innerHTML = `<section class="messages-auth"><h1>Сообщения</h1><p>${error.code === "registration_required" ? "Войдите в Liberterra, чтобы видеть переписку с агентами." : "Сервис сообщений временно недоступен. Попробуйте позже."}</p><a href="/profile.html">Войти в профиль</a></section>`;
      return;
    }
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-thread-id]");
      if (button) showThread(state, button.dataset.threadId);
    });
    root.addEventListener("submit", async (event) => {
      const form = event.target.closest("[data-message-form]");
      if (!form || !state.activeId) return;
      event.preventDefault();
      const button = form.querySelector("button");
      const text = String(new FormData(form).get("text") || "").trim();
      if (!text) return;
      button.disabled = true;
      try {
        await api("send_message", { thread_id: state.activeId, text });
        form.reset();
        const listed = await api("list_message_threads");
        state.threads = listed.threads || state.threads;
        await showThread(state, state.activeId);
      } catch (error) {
        button.textContent = error.code === "rate_limit" ? "Подождите минуту" : "Не отправлено";
      } finally { button.disabled = false; }
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-message-thread]");
    if (button) openThreadFromObject(button);
  });
  window.addEventListener("liberterra:object-rendered", (event) => {
    if (!event.detail?.isRequest) addObjectAction(event.detail?.objectId);
  });
  window.addEventListener("liberterra:user-registered", refreshBadge);
  const boot = () => { addHeaderControl(); refreshBadge(); mountMessagesPage(); window.setInterval(refreshBadge, 60000); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
})();
