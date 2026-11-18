(() => {
  "use strict";

  const root = document.querySelector("#adminDashboard");
  if (!root) return;
  const telegram = window.Telegram?.WebApp;
  const initData = String(telegram?.initData || "").trim();
  const state = root.querySelector("#dashboardState");
  const content = root.querySelector("#dashboardContent");
  const refresh = root.querySelector("#refreshDashboard");
  const number = new Intl.NumberFormat("ru-RU");

  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => clean(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const formatDate = (value, includeTime = true) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return clean(value);
    return new Intl.DateTimeFormat("ru-RU", includeTime
      ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit" }).format(parsed);
  };
  const metric = (label, value, note, tone = "") => `
    <article class="admin-metric ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${number.format(Number(value || 0))}</strong>
      <small>${escapeHtml(note)}</small>
    </article>`;

  function renderMetrics(metrics) {
    root.querySelector("#dashboardMetrics").innerHTML = [
      metric("Посещения сегодня", metrics.visits_today, `${number.format(metrics.visits_7d || 0)} за 7 дней`, "is-blue"),
      metric("Регистрации сегодня", metrics.registrations_today, `${number.format(metrics.registrations_7d || 0)} за 7 дней`, "is-green"),
      metric("Все пользователи", metrics.registered_users, "активные аккаунты"),
      metric("Агенты", metrics.approved_agents, `${number.format(metrics.pending_agents || 0)} ожидают проверки`, "is-gold"),
      metric("Активные объявления", metrics.active_listings, `${number.format(metrics.moderation_listings || 0)} на модерации`, "is-red"),
      metric("Активные заявки", metrics.active_requests, "заявки на поиск"),
    ].join("");
  }

  function renderWeek(daily) {
    const maxValue = Math.max(1, ...daily.flatMap((item) => [Number(item.visits || 0), Number(item.registrations || 0)]));
    root.querySelector("#dashboardWeekChart").innerHTML = daily.map((item) => `
      <div class="admin-day">
        <div class="admin-day-bars">
          <i class="visits" style="height:${Math.max(4, Number(item.visits || 0) / maxValue * 100)}%" title="Посещения: ${Number(item.visits || 0)}"></i>
          <i class="registrations" style="height:${Math.max(4, Number(item.registrations || 0) / maxValue * 100)}%" title="Регистрации: ${Number(item.registrations || 0)}"></i>
        </div>
        <strong>${formatDate(`${item.date}T00:00:00`, false)}</strong>
        <small>${number.format(item.visits || 0)} / ${number.format(item.registrations || 0)}</small>
      </div>`).join("");
  }

  function renderTopPages(pages) {
    const max = Math.max(1, ...pages.map((item) => Number(item.visits || 0)));
    root.querySelector("#dashboardTopPages").innerHTML = pages.length ? pages.map((item) => `
      <div class="admin-page-row">
        <span><b>${escapeHtml(item.page)}</b><small>${number.format(item.visits || 0)}</small></span>
        <i><b style="width:${Number(item.visits || 0) / max * 100}%"></b></i>
      </div>`).join("") : '<div class="crm-empty"><strong>Данных пока нет</strong><span>Посещения появятся после новых открытий платформы.</span></div>';
  }

  function renderFunnel(metrics) {
    const rows = [
      ["Зарегистрированные пользователи", metrics.registered_users],
      ["Одобренные агенты", metrics.approved_agents],
      ["Активные объявления", metrics.active_listings],
      ["Активные заявки", metrics.active_requests],
    ];
    const max = Math.max(1, ...rows.map((row) => Number(row[1] || 0)));
    root.querySelector("#dashboardFunnel").innerHTML = rows.map(([label, value], index) => `
      <div class="admin-funnel-step">
        <span><b>${index + 1}</b>${escapeHtml(label)}</span>
        <strong>${number.format(value || 0)}</strong>
        <i><b style="width:${Math.max(3, Number(value || 0) / max * 100)}%"></b></i>
      </div>`).join("");
  }

  function renderUsers(users) {
    root.querySelector("#dashboardRecentUsers").innerHTML = users.length ? users.map((user) => `
      <tr>
        <td><strong>${escapeHtml(user.name)}</strong>${user.username ? `<a href="https://t.me/${encodeURIComponent(user.username)}" target="_blank" rel="noopener">@${escapeHtml(user.username)}</a>` : ""}</td>
        <td>${escapeHtml(user.account_type)}</td>
        <td>${escapeHtml(formatDate(user.registered_at))}</td>
        <td>${escapeHtml(formatDate(user.last_seen_at))}</td>
        <td>${number.format(user.visits || 0)}</td>
      </tr>`).join("") : '<tr><td colspan="5">Регистраций пока нет</td></tr>';
  }

  async function load() {
    if (!initData) {
      state.className = "admin-dashboard-state is-error";
      state.innerHTML = "<strong>Откройте дашборд через Telegram-бот</strong><span>В браузере административные данные недоступны.</span>";
      return;
    }
    refresh.disabled = true;
    state.className = "admin-dashboard-state";
    state.textContent = "Обновляем статистику…";
    state.hidden = false;
    try {
      const response = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_init_data: initData }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        const error = new Error(result.error || "dashboard_unavailable");
        error.status = response.status;
        throw error;
      }
      renderMetrics(result.metrics || {});
      renderWeek(Array.isArray(result.daily) ? result.daily : []);
      renderTopPages(Array.isArray(result.top_pages) ? result.top_pages : []);
      renderFunnel(result.metrics || {});
      renderUsers(Array.isArray(result.recent_users) ? result.recent_users : []);
      root.querySelector("#dashboardUpdated").textContent = `Обновлено: ${formatDate(result.generated_at)}`;
      state.hidden = true;
      content.hidden = false;
    } catch (error) {
      content.hidden = true;
      state.hidden = false;
      state.className = "admin-dashboard-state is-error";
      state.innerHTML = error.status === 403
        ? "<strong>Доступ запрещён</strong><span>Этот раздел доступен только владельцу Liberterra.</span>"
        : "<strong>Не удалось загрузить статистику</strong><span>Проверьте подключение и повторите попытку.</span>";
    } finally {
      refresh.disabled = false;
    }
  }

  telegram?.ready?.();
  telegram?.expand?.();
  refresh.addEventListener("click", load);
  load();
})();
