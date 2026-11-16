(()=>{if(document.querySelector('.profile-v2-layout'))return;if(!document.getElementById('liberterra-v20-global-styles')){const l=document.createElement('link');l.id='liberterra-v20-global-styles';l.rel='stylesheet';l.href='/v20-global.css';document.head.append(l)}if(!document.getElementById('liberterra-profile-v2-styles')){const s=document.createElement('link');s.id='liberterra-profile-v2-styles';s.rel='stylesheet';s.href='/profile-v2.css';document.head.append(s)}})();
(() => {
  function ensureV2Layout() {
    if (document.querySelector(".profile-v2-layout")) return;
    const main = document.querySelector("main.profile-main");
    if (!main || !main.querySelector("#profileCard") || !main.querySelector("#profileFavoritesGrid")) return;
    document.body.classList.add("v20", "profile-v2-runtime");
    const mobileHeader = document.createElement("div");
    mobileHeader.className = "pv2-mobile-header";
    mobileHeader.innerHTML = '<a href="/" class="pv2-mobile-brand">Liberterra <span class="dot"></span></a><a href="#profileCard" class="pv2-mobile-user-btn" aria-label="К профилю">Л</a>';
    const layout = document.createElement("div");
    layout.className = "profile-v2-layout";
    const sidebar = document.createElement("aside");
    sidebar.className = "profile-v2-sidebar";
    sidebar.setAttribute("aria-label", "Личный кабинет");
    sidebar.innerHTML = '<a href="/" class="pv2-sidebar-brand">Liberterra <span class="dot"></span></a><div class="pv2-sidebar-section">Основное</div><ul class="pv2-sidebar-nav"><li><a href="/profile" class="active" aria-current="page"><span class="pv2-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></span>Обзор</a></li><li><a href="/my-listings.html"><span class="pv2-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>Мои объекты<span class="badge" data-count="objects">0</span></a></li><li><a href="/my-requests.html"><span class="pv2-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>Мои заявки<span class="badge" data-count="requests">0</span></a></li><li><a href="#profileFavorites"><span class="pv2-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></span>Избранное<span class="badge" data-count="favorites">0</span></a></li><li><a href="/agent-cabinet.html"><span class="pv2-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span>Рабочая база CRM</a></li></ul><div class="pv2-sidebar-section">Инструменты</div><ul class="pv2-sidebar-nav"><li><a href="/viewing-history.html"><span class="pv2-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>История просмотров<span class="pv2-soon-badge">скоро</span></a></li><li><a href="https://t.me/Liberterra_kg_bot?start=support" target="_blank" rel="noopener"><span class="pv2-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>Поддержка</a></li></ul><div class="pv2-sidebar-bottom"><div class="pv2-sidebar-user"><div class="pv2-sidebar-avatar" aria-hidden="true">Л</div><div><div class="pv2-sidebar-user-name">Пользователь</div><div class="pv2-sidebar-user-role">Клиент</div></div></div></div>';
    main.before(mobileHeader, layout);
    layout.append(sidebar, main);
    main.className = "profile-v2-main";
    main.setAttribute("role", "main");
    const topbar = document.createElement("div");
    topbar.innerHTML = "<div class=\"pv2-topbar\">\n        <a href=\"/\" class=\"pv2-back-to-site\">← На главную</a>\n        <label class=\"pv2-language-picker language-switcher\"><span>Язык</span>\n          <select id=\"profileLanguage\" aria-label=\"Выбор языка\">\n            <option value=\"ru\">RU · Русский</option>\n            <option value=\"ky\">KG · Кыргызча</option>\n            <option value=\"en\">EN · English</option>\n            <option value=\"zh\">中文</option>\n          </select>\n        </label>\n      </div>";
    main.prepend(topbar.firstElementChild);
    const hero = main.querySelector(".profile-hero");
    if (hero) { hero.className = "pv2-section"; hero.innerHTML = '<h1 class="pv2-section-title">Мой профиль</h1>'; }
    const favorites = main.querySelector("#profileFavorites");
    favorites?.classList.add("pv2-section");
    const mobileNav = document.createElement("nav");
    mobileNav.className = "pv2-mobile-nav";
    mobileNav.setAttribute("aria-label", "Разделы кабинета");
    mobileNav.innerHTML = '<a href="/profile" class="active" aria-current="page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Обзор</a><a href="/my-listings.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Объекты</a><a href="/my-requests.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Заявки</a><a href="/agent-cabinet.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>CRM</a>';
    layout.after(mobileNav);
  }
  ensureV2Layout();
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
  const profileCacheKey = "liberterra-profile-v2-view";
  let loading = false;
  let loaded = false;
  let profileUser = null;

  function renderAgentApplication() {
    profileNode.querySelector("[data-agent-application-status]")?.remove();
    if (!profileUser) return;
    const state = window.LiberterraAgentAccess?.getState();
    // The Telegram onboarding state is not the status of a website agent account.
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
    section.className = "pv2-agent-status";
    section.setAttribute("aria-live", "polite");
    section.innerHTML = `<span class="pv2-agent-status-icon ${escapeHtml(failed ? "rejected" : role || "pending")}" aria-hidden="true">${failed || ["rejected", "blocked"].includes(role) ? "!" : role === "approved" ? "✓" : "◷"}</span><span class="pv2-agent-status-text"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></span>`;
    if (failed || (!checking && ["guest", "rejected"].includes(role))) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "profile-primary";
      button.setAttribute(failed ? "data-agent-retry" : "data-agent-open", "");
      button.textContent = failed ? "Повторить проверку" : role === "rejected" ? "Исправить анкету" : "Заполнить анкету агента";
      section.append(button);
    }
    (profileNode.querySelector(".pv2-quick-actions") || profileNode.querySelector("[data-profile-logout]") || profileNode).before(section);
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
      const emailLink = hasTelegramSession ? '<button class="pv2-action-btn" type="button" data-link-telegram-account>Вход на сайт без Telegram</button>' : "";
      const phone = clean(user.phone);
      const email = clean(user.email);
      const agency = clean(user.agency);
      const specialization = clean(user.specialization);
      const certificate = clean(user.certificate_number);
      const registrationDate = user.created_at ? new Date(user.created_at) : null;
      const registrationLabel = registrationDate && !Number.isNaN(registrationDate.getTime())
        ? registrationDate.toLocaleDateString("ru", { day: "numeric", month: "short", year: "numeric" }) : "—";
      const activeCount = response.active_object_count == null ? "—" : Number(response.active_object_count);
      const isAgent = ["agent", "Агент", "admin", "Администратор"].includes(clean(user.account_type));
      const agentRole = window.LiberterraAgentAccess?.getState?.()?.role;
      const showAgentCta = !isAgent && !["pending", "approved", "rejected", "blocked"].includes(agentRole);
      const avatarEditorEnabled = Boolean(user.can_edit_photo && window.LiberterraAgentPhoto?.editor);
      const contactHtml = phone
        ? `<a class="pv2-profile-phone" href="tel:${escapeHtml(phone.replace(/[^+\d]/g, ""))}">${escapeHtml(phone)}</a>`
        : email ? `<span class="pv2-profile-phone">${escapeHtml(email)}</span>` : "";
      // CRM authorization is enforced by its API; profile labels can lag the
      // agent's actual access, so do not hide the entry based on account_type.
      profileNode.innerHTML = `
        <div class="pv2-profile-header">
          <div class="pv2-avatar-wrapper"><div class="pv2-avatar" aria-label="Фото профиля">${escapeHtml(initial)}</div></div>
          <div class="pv2-profile-info">
            <h2 class="pv2-profile-name">${escapeHtml(user.name || "Пользователь Liberterra")}</h2>
            <div class="pv2-profile-meta"><span class="pv2-role-badge">${escapeHtml(user.account_type || "Клиент")}</span>${contactHtml}</div>
          </div>
          ${avatarEditorEnabled ? '<div class="pv2-profile-actions"><button class="pv2-btn pv2-btn-secondary" type="button" data-pv2-avatar-edit>Изменить фото</button></div>' : ""}
        </div>
        <div class="pv2-stats-grid" aria-label="Статистика профиля">
          <a class="pv2-stat-card highlight" href="/my-listings.html"><div class="pv2-stat-value">${Number(response.own_object_count || 0)}</div><div class="pv2-stat-label">Мои объекты</div><div class="pv2-stat-sub">всего</div></a>
          <a class="pv2-stat-card" href="/my-listings.html"><div class="pv2-stat-value">${escapeHtml(activeCount)}</div><div class="pv2-stat-label">Активные</div><div class="pv2-stat-sub">${activeCount === "—" ? "данные пока недоступны" : "объявления"}</div></a>
          <a class="pv2-stat-card" href="/my-requests.html"><div class="pv2-stat-value">${Number(response.own_request_count || 0)}</div><div class="pv2-stat-label">Мои заявки</div><div class="pv2-stat-sub">на подбор</div></a>
          <a class="pv2-stat-card" href="#profileFavorites"><div class="pv2-stat-value">${favorites.length}</div><div class="pv2-stat-label">Избранное</div><div class="pv2-stat-sub">объектов</div></a>
        </div>
        ${showAgentCta ? '<div class="pv2-agent-cta"><div class="pv2-agent-cta-icon" aria-hidden="true">⌂</div><div class="pv2-agent-cta-text"><strong>Стать риелтором</strong><span>Создайте профиль агента и размещайте объекты</span></div><button class="pv2-btn" type="button" data-agent-open>Подать заявку</button></div>' : ""}
        <div class="pv2-quick-actions">
          <a class="pv2-action-btn primary" href="/add-object.html"><span class="pv2-action-icon" aria-hidden="true"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span><span class="pv2-action-text"><strong>Разместить объект</strong><span>Добавить в каталог</span></span></a>
          <a class="pv2-action-btn" href="/add-request.html"><span class="pv2-action-icon" aria-hidden="true"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="M13 13l4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span><span class="pv2-action-text"><strong>Оставить заявку</strong><span>Запрос на подбор</span></span></a>
          ${emailLink}
        </div>
        <section class="pv2-section"><div class="pv2-section-header"><h3 class="pv2-section-title">Личные данные</h3><span class="pv2-data-edit-note" title="Пока нет подтверждённого API сохранения профиля">Редактирование появится позже</span></div>
          <div class="pv2-data-grid">
            <div><div class="pv2-data-label"><svg class="pv2-data-icon" width="14" height="14" fill="none" viewBox="0 0 14 14"><circle cx="7" cy="4.5" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 12.5c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>Имя</div><div class="pv2-data-value">${escapeHtml(user.name || "Не указано")}</div></div>
            <div><div class="pv2-data-label"><svg class="pv2-data-icon" width="14" height="14" fill="none" viewBox="0 0 14 14"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M2 4l5 3.5L12 4" stroke="currentColor" stroke-width="1.2"/></svg>Email</div><div class="pv2-data-value">${escapeHtml(email || "Не указан")}</div></div>
            <div><div class="pv2-data-label"><svg class="pv2-data-icon" width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M5.5 2H4a1.5 1.5 0 00-1.5 1.5c0 4.7 3.8 8.5 8.5 8.5A1.5 1.5 0 0012.5 10.5V9l-2.5-1-1 1.5c-1.5-.7-2.8-2-3.5-3.5L7 5 5.5 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>Телефон</div><div class="pv2-data-value">${escapeHtml(phone || "Не указан")}</div></div>
            <div><div class="pv2-data-label"><svg class="pv2-data-icon" width="14" height="14" fill="none" viewBox="0 0 14 14"><rect x="2" y="3" width="10" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M5 6h1.5M5 8.5h1.5M7.5 6H9M7.5 8.5H9M5.5 12V10.5h3V12" stroke="currentColor" stroke-width="1.1"/></svg>Агентство</div><div class="pv2-data-value${agency ? "" : " empty"}">${escapeHtml(agency || "Не указано")}</div></div>
            ${specialization ? `<div><div class="pv2-data-label"><svg class="pv2-data-icon" width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M7 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L7 10.7 3.4 12.5l.7-4L1.2 5.7l4-.6z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>Специализация</div><div class="pv2-data-value">${escapeHtml(specialization)}</div></div>` : ""}
            <div><div class="pv2-data-label"><svg class="pv2-data-icon" width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M12.5 2L5.5 9l-2.5 1 1-2.5L11 .5l1.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M1.5 12.5h11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>Telegram</div><div class="pv2-data-value">${user.telegram_id || hasTelegramSession ? "Привязан" : "Не привязан"}</div></div>
            <div><div class="pv2-data-label"><svg class="pv2-data-icon" width="14" height="14" fill="none" viewBox="0 0 14 14"><rect x="1.5" y="3" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 6.5h11M4.5 1.5v3M9.5 1.5v3" stroke="currentColor" stroke-width="1.2"/></svg>Дата регистрации</div><div class="pv2-data-value">${escapeHtml(registrationLabel)}</div></div>
            ${certificate ? `<div class="pv2-data-full"><div class="pv2-data-label"><svg class="pv2-data-icon" width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M7 1L2 3.5v4c0 3.5 5 5.5 5 5.5s5-2 5-5.5v-4z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.5 7l1.5 1.5L9 5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Сертификат аттестации риэлтора</div><div class="pv2-data-value linked">№ ${escapeHtml(certificate)}</div></div>` : ""}
          </div>
        </section>
        <button class="profile-logout pv2-btn pv2-btn-secondary" type="button" data-profile-logout>Выйти из аккаунта</button>
        ${avatarEditorEnabled ? '<div class="pv2-modal-overlay" id="pv2AvatarModal" role="dialog" aria-modal="true" aria-label="Фото профиля" aria-hidden="true"><div class="pv2-modal"><div class="pv2-modal-header"><h3>Фото профиля</h3><button class="pv2-modal-close" type="button" data-pv2-avatar-close aria-label="Закрыть">×</button></div><div class="pv2-modal-body" data-pv2-avatar-editor-slot></div></div></div>' : ""}`;
      renderFavorites(favorites);
      const avatar = profileNode.querySelector(".pv2-avatar");
      window.LiberterraAgentPhoto?.show(avatar, user.avatar_url, user.name);
      const sidebarAvatar = document.querySelector(".pv2-sidebar-avatar");
      window.LiberterraAgentPhoto?.show(sidebarAvatar, user.avatar_url, user.name);
      const sidebarName = document.querySelector(".pv2-sidebar-user-name");
      const sidebarRole = document.querySelector(".pv2-sidebar-user-role");
      if (sidebarName) sidebarName.textContent = user.name || "Пользователь";
      if (sidebarRole) sidebarRole.textContent = user.account_type || "Клиент";
      const mobileBtn = document.querySelector(".pv2-mobile-user-btn");
      if (mobileBtn && !mobileBtn.querySelector("img")) mobileBtn.textContent = initial;
      for (const [key, count] of Object.entries({ objects: response.own_object_count || 0, requests: response.own_request_count || 0, favorites: favorites.length })) {
        const badge = document.querySelector(`.pv2-sidebar-nav .badge[data-count="${key}"]`);
        if (badge) badge.textContent = String(count);
      }
      try { sessionStorage.setItem(profileCacheKey, JSON.stringify({ profileHtml: profileNode.innerHTML, favoritesHtml: favoritesNode.innerHTML })); } catch (_) {}
      window.LiberterraAgentPhoto?.editor(profileNode, user, (url) => {
        try { sessionStorage.removeItem(profileCacheKey); } catch (_) {}
        window.LiberterraAgentPhoto.show(avatar, url, user.name);
        window.LiberterraAgentPhoto.show(sidebarAvatar, url, user.name);
      });
      const editorSlot = profileNode.querySelector("[data-pv2-avatar-editor-slot]");
      const photoEditor = profileNode.querySelector(".agent-photo-editor");
      if (editorSlot && photoEditor) editorSlot.append(photoEditor);
      renderAgentApplication();
      window.LiberterraRegistry?.editor(profileNode);
      loaded = true;
    } catch (error) {
      profileNode.innerHTML = hasTelegramSession
        ? '<div class="profile-empty"><strong>Не удалось загрузить профиль</strong><span>Нажмите «Повторить». Если ошибка сохранится — отправьте скриншот администратору.</span><button class="profile-primary" type="button" data-profile-retry>Повторить</button></div>'
        : '<div class="profile-empty"><strong>Не удалось загрузить профиль</strong><span>Войдите по email и паролю, затем обновите страницу.</span></div>';
    } finally { loading = false; }
  }

  window.addEventListener("liberterra:agent-role", () => { renderAgentApplication(); loadProfile({ force: true }); });
  window.addEventListener("liberterra:user-registered", () => loadProfile({ force: true }));
  profileNode.addEventListener("click", async (event) => {
    const modal = profileNode.querySelector("#pv2AvatarModal");
    if (event.target.closest("[data-pv2-avatar-edit]")) {
      modal?.classList.add("open");
      modal?.setAttribute("aria-hidden", "false");
      modal?.querySelector("[data-pv2-avatar-close]")?.focus();
      return;
    }
    if (event.target.closest("[data-pv2-avatar-close]") || event.target === modal) {
      modal?.classList.remove("open");
      modal?.setAttribute("aria-hidden", "true");
      return;
    }
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
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const modal = profileNode.querySelector("#pv2AvatarModal.open");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    profileNode.querySelector("[data-pv2-avatar-edit]")?.focus();
  });
  const toolbarControls = document.querySelector('.pv2-toolbar-controls') || document.querySelector('.pv2-topbar');
  if (toolbarControls && !toolbarControls.querySelector('.pv2-toolbar-theme')) {
    const themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'pv2-toolbar-theme';
    themeBtn.style.cssText = 'border:1px solid var(--v20-line);border-radius:8px;padding:6px 12px;background:transparent;color:var(--v20-ink);font:500 13px/1 Onest,system-ui,sans-serif;cursor:pointer';
    const isDark = () => document.body.getAttribute('data-public-theme') === 'dark';
    themeBtn.textContent = isDark() ? '☀ Светлая' : '☾ Тёмная';
    themeBtn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.body.setAttribute('data-public-theme', next);
      try { localStorage.setItem('liberterra_theme', next); } catch (_) {}
      themeBtn.textContent = next === 'dark' ? '☀ Светлая' : '☾ Тёмная';
    });
    toolbarControls.append(themeBtn);
  }
  loadProfile();
})();

// Use the same language state and translation engine as the public site.
(() => {
  const supported = new Set(['ru', 'ky', 'en', 'zh']);
  function bindProfileLanguage() {
    const picker = document.getElementById('profileLanguage');
    if (!picker || picker.dataset.bound) return;
    picker.dataset.bound = 'true';
    const sync = language => {
      const next = language || window.LiberterraI18n?.language || 'ru';
      if (supported.has(next)) picker.value = next;
    };
    sync();
    picker.addEventListener('change', () => window.LiberterraI18n?.setLanguage(picker.value));
    window.addEventListener('liberterra:languagechange', event => sync(event.detail?.language));
    window.addEventListener('storage', event => {
      if (event.key === 'liberterra_language_v1') sync(event.newValue);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindProfileLanguage, { once: true });
  else bindProfileLanguage();
})();
