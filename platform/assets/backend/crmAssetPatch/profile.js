(() => {
  const profileNode = document.querySelector("#profileCard");
  const favoritesNode = document.querySelector("#profileFavoritesGrid");
  const rows = Array.isArray(window.LIBERTERRA_LOCAL_OBJECTS) ? window.LIBERTERRA_LOCAL_OBJECTS : [];
  const clean = (value) => String(value || "").trim();
  const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";
  const escapeHtml = (value) => clean(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const photo = (value) => {
    const source = clean(value).split(/\s*(?:\||\n)\s*/).filter(Boolean)[0] || "";
    const filename = source.split(/[?#]/, 1)[0].split("/").pop();
    return /^object_[^/]+\.(?:jpe?g|png|webp)$/i.test(filename || "")
      ? `${PHOTO_DELIVERY_ORIGIN}/uploads/${encodeURIComponent(filename)}`
      : source;
  };
  const objectById = new Map(rows.map((row) => [clean(row.id), row]));
  const profileCacheKey = "liberterra-profile-view";
  let loading = false;
  let loaded = false;
  let profileUser = null;

  function renderAgentApplication() {
    profileNode.querySelector("[data-agent-application-status]")?.remove();
    if (!profileUser) return;
    const state = window.LiberterraAgentAccess?.getState();
    if (profileUser.account_type === "Агент" && !state?.isTelegramSession) return;
    const role = state?.role;
    if (profileUser.account_type !== "Агент" && !["pending", "approved", "rejected", "blocked"].includes(role)) return;
    const labels = {
      guest: ["Анкета не заполнена", "Заполните анкету агента. После одобрения ваш профиль появится в списке агентов."],
      pending: ["На проверке", "Анкета отправлена администратору. Повторно отправлять её не нужно."],
      approved: ["Подтверждён", "Ваша анкета агента одобрена."],
      rejected: ["Анкета отклонена", "Уточните причину у администратора. Вы можете исправить и отправить анкету повторно."],
      blocked: ["Доступ ограничен", "Обратитесь к администратору."],
    };
    const checking = !state || state.checking;
    const failed = !checking && (state.checkError || !labels[role]);
    const [title, description] = checking ? ["Проверяем статус анкеты…", ""]
      : failed ? ["Статус временно недоступен", "Повторите проверку. Это не означает, что анкета отсутствует."] : labels[role];
    const section = document.createElement("section");
    section.dataset.agentApplicationStatus = "true";
    section.className = "profile-empty";
    section.setAttribute("aria-live", "polite");
    section.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span>`;
    if (failed || (!checking && ["guest", "rejected"].includes(role))) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "profile-primary";
      button.setAttribute(failed ? "data-agent-retry" : "data-agent-open", "");
      button.textContent = failed ? "Повторить проверку" : role === "rejected" ? "Исправить анкету" : "Заполнить анкету агента";
      section.append(button);
    }
    profileNode.append(section);
  }

  try {
    const cached = JSON.parse(sessionStorage.getItem(profileCacheKey) || "null");
    if (cached?.profileHtml) profileNode.innerHTML = cached.profileHtml;
    if (cached?.favoritesHtml) favoritesNode.innerHTML = cached.favoritesHtml;
  } catch (_) {}

  function renderFavorites(ids) {
    const objects = ids.map((id) => objectById.get(String(id))).filter(Boolean);
    favoritesNode.innerHTML = objects.length ? objects.map((item) => `
      <a class="profile-favorite-card" href="/object?id=${encodeURIComponent(item.id)}">
        ${photo(item.photo_url) ? `<img src="${escapeHtml(photo(item.photo_url))}" alt="" loading="lazy" decoding="async">` : '<span class="object-map-no-photo">Фото готовится</span>'}
        <span><strong>${escapeHtml(item.price || "Цена по запросу")}</strong><b>${escapeHtml(item.title || "Объект недвижимости")}</b><small>${escapeHtml(item.district || "Бишкек")}</small></span>
      </a>`).join("") : '<div class="profile-empty"><strong>Избранных объектов пока нет</strong><span>Нажмите ♡ в каталоге — сохранённый объект появится здесь на всех ваших устройствах.</span><a href="/">Перейти в каталог</a></div>';
  }

  async function loadProfile({ force = false } = {}) {
    const hasTelegramSession = Boolean(window.LiberterraAgentAccess?.hasUserSession());
    let hasWebSession = !hasTelegramSession && Boolean(window.LiberterraUserAccess?.isRegistered?.());
    if (!hasTelegramSession && !hasWebSession && window.LiberterraUserAccess?.check) {
      hasWebSession = await window.LiberterraUserAccess.check();
    }
    if (loading || (loaded && !force) || (!hasTelegramSession && !hasWebSession)) return;
    loading = true;
    try {
      const response = hasTelegramSession
        ? await window.LiberterraAgentAccess.request("get_user_profile", {})
        : await fetch("/api/user-access", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "web_profile" }) }).then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok || !body.ok) throw new Error(body.error || "profile_unavailable");
          return body;
        });
      const user = response.user || {};
      profileUser = user;
      let localFavorites = [];
      try { localFavorites = JSON.parse(localStorage.getItem("liberterra_favorite_objects_v1") || "[]").map(String); } catch (_) {}
      const remoteFavorites = (response.favorite_object_ids || []).map(String);
      const favorites = [...new Set([...localFavorites, ...remoteFavorites])];
      const remoteSet = new Set(remoteFavorites);
      const unsyncedFavorites = localFavorites.filter((id) => !remoteSet.has(id));
      if (unsyncedFavorites.length) {
        try {
          await window.LiberterraAgentAccess.request("set_user_favorites", { object_ids: unsyncedFavorites });
        } catch (_) {}
      }
      localStorage.setItem("liberterra_favorite_objects_v1", JSON.stringify(favorites));
      const initial = clean(user.name).slice(0, 1).toUpperCase() || "L";
      const emailLink = hasTelegramSession ? '<button class="profile-link-email" type="button" data-link-telegram-account>Вход на сайт без Telegram</button>' : "";
      const contactValue = clean(user.phone) || clean(user.email) || "Контакты не указаны";
      const contactHtml = clean(user.phone)
        ? `<a href="tel:${escapeHtml(clean(user.phone).replace(/[^+\d]/g, ""))}">${escapeHtml(contactValue)}</a>`
        : `<span>${escapeHtml(contactValue)}</span>`;
      const agentCrmLink = '<a href="/api/crm/agent-cabinet"><span class="profile-menu-icon">▣</span><span><strong>Рабочая база CRM</strong><small>Объекты, собственники и закрытые документы</small></span><i>›</i></a>';
      profileNode.innerHTML = `<div class="profile-identity"><span>${escapeHtml(initial)}</span><div><small>${escapeHtml(user.account_type || "Клиент")}</small><h2>${escapeHtml(user.name || "Пользователь Liberterra")}</h2>${contactHtml}</div></div><div class="profile-quick-actions"><a class="profile-primary" href="/add-object.html">Разместить объект</a><a href="/add-request.html">Оставить заявку</a>${emailLink}</div><nav class="profile-menu" aria-label="Личные разделы">${agentCrmLink}<a href="/my-listings.html"><span class="profile-menu-icon">⌂</span><span><strong>Мои объявления</strong><small>Управление объектами</small></span><b>${Number(response.own_object_count || 0)}</b><i>›</i></a><a href="/my-requests.html"><span class="profile-menu-icon">⌕</span><span><strong>Мои заявки</strong><small>Поиск недвижимости</small></span><b>${Number(response.own_request_count || 0)}</b><i>›</i></a><a href="#profileFavorites"><span class="profile-menu-icon">♡</span><span><strong>Избранное</strong><small>Сохранённые объекты</small></span><b>${favorites.length}</b><i>›</i></a></nav><button class="profile-logout" type="button" data-profile-logout>Выйти из аккаунта</button>`;
      renderFavorites(favorites);
      const avatar = profileNode.querySelector(".profile-identity > span");
      window.LiberterraAgentPhoto?.show(avatar, user.avatar_url, user.name);
      try { sessionStorage.setItem(profileCacheKey, JSON.stringify({ profileHtml: profileNode.innerHTML, favoritesHtml: favoritesNode.innerHTML })); } catch (_) {}
      window.LiberterraAgentPhoto?.editor(profileNode, user, (url) => window.LiberterraAgentPhoto.show(avatar, url, user.name));
      renderAgentApplication();
      window.LiberterraRegistry?.editor(profileNode);
      loaded = true;
    } catch (error) {
      profileNode.innerHTML = hasTelegramSession
        ? '<div class="profile-empty"><strong>Не удалось загрузить профиль</strong><span>Нажмите «Повторить». Если ошибка сохранится — отправьте скриншот администратору.</span><button class="profile-primary" type="button" data-profile-retry>Повторить</button></div>'
        : '<div class="profile-empty"><strong>Не удалось загрузить профиль</strong><span>Войдите по email и паролю, затем обновите страницу.</span></div>';
    } finally { loading = false; }
  }

  window.addEventListener("liberterra:agent-role", () => { renderAgentApplication(); loadProfile(); });
  window.addEventListener("liberterra:user-registered", () => loadProfile({ force: true }));
  profileNode.addEventListener("click", async (event) => {
    if (event.target.closest("[data-profile-retry]")) {
      loaded = false;
      await loadProfile({ force: true });
      return;
    }
    if (event.target.closest("[data-link-telegram-account]")) {
      window.LiberterraUserAccess?.linkTelegramAccount?.();
      return;
    }
    const button = event.target.closest("[data-profile-logout]");
    if (!button) return;
    button.disabled = true;
    button.textContent = "Выходим…";
    try {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      sessionStorage.removeItem(profileCacheKey);
      location.assign("/");
    }
  });
  window.setTimeout(loadProfile, 500);
})();
