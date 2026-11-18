(() => {
  "use strict";

  const root = document.querySelector("#agentDirectoryPage");
  if (!root) return;

  const list = root.querySelector("#agentDirectoryList");
  const summary = root.querySelector("#agentDirectorySummary");
  const search = root.querySelector("#agentDirectorySearch");
  const specialization = root.querySelector("#agentSpecializationFilter");
  let agents = [];
  let loading = false;

  const text = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => text(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const normalize = (value) => text(value).toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
  const initials = (name) => text(name).split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase()).join("") || "L";
  const objectWord = (count) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "объявление";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "объявления";
    return "объявлений";
  };
  const specializationLabel = (value) => value === "sale" ? "Продажа" : value === "rent" ? "Аренда" : "Недвижимость";

  function card(agent) {
    const count = Number(agent.active_object_count || 0);
    const username = text(agent.username).replace(/^@/, "");
    const profileUrl = `/agent-public.html?agent=${encodeURIComponent(agent.public_ref)}`;
    const details = [
      agent.agency ? `Агентство: ${escapeHtml(agent.agency)}` : "Независимый специалист",
      agent.experience ? `Опыт: ${escapeHtml(agent.experience)}` : "",
      agent.rating ? `★ ${escapeHtml(agent.rating)}` : "",
    ].filter(Boolean);
    return `
      <article class="agent-directory-card">
        <a class="agent-directory-profile-link" href="${profileUrl}" aria-label="Открыть профиль ${escapeHtml(agent.name)}">
          <span class="agent-directory-avatar" aria-hidden="true">${escapeHtml(initials(agent.name))}</span>
          <span class="agent-directory-copy">
            <span class="agent-directory-name-row">
              <strong>${escapeHtml(agent.name)}</strong>
              <span class="agent-directory-badge">${escapeHtml(specializationLabel(agent.specialization))}</span>
            </span>
            <span class="agent-directory-meta">${details.join(" · ")}</span>
            <span class="agent-directory-count">${count} ${objectWord(count)}</span>
          </span>
          <span class="agent-directory-arrow" aria-hidden="true">→</span>
        </a>
        ${username ? `<a class="agent-directory-contact" href="https://t.me/${encodeURIComponent(username)}" target="_blank" rel="noopener">Написать в Telegram</a>` : ""}
      </article>
    `;
  }

  function render() {
    const query = normalize(search.value);
    const direction = specialization.value;
    const visible = agents.filter((agent) => {
      const searchable = normalize(`${agent.name} ${agent.agency} ${agent.experience}`);
      return (!query || searchable.includes(query))
        && (direction === "all" || agent.specialization === direction);
    });
    summary.textContent = `Найдено специалистов: ${visible.length}`;
    list.innerHTML = visible.length
      ? visible.map(card).join("")
      : '<div class="crm-empty"><strong>Специалисты не найдены</strong><span>Измените имя, агентство или специализацию.</span></div>';
    list.querySelectorAll(".agent-directory-avatar").forEach((node, index) => {
      window.LiberterraAgentPhoto?.show(node, visible[index].avatar_url, visible[index].name);
    });
  }

  async function load() {
    if (loading) return;
    loading = true;
    summary.textContent = "Загружаем специалистов...";
    list.innerHTML = '<div class="crm-empty"><strong>Пожалуйста, подождите</strong><span>Получаем актуальный список агентов.</span></div>';
    try {
      const response = await window.LiberterraAgentAccess.publicRequest("list_public_agents", {});
      agents = Array.isArray(response.agents) ? response.agents : [];
      render();
    } catch (error) {
      summary.textContent = "Не удалось загрузить список";
      list.innerHTML = `<div class="crm-empty"><strong>Список временно недоступен</strong><span>${escapeHtml(error.message)}</span><button class="agent-directory-contact" type="button" data-agent-directory-retry>Повторить</button></div>`;
    } finally {
      loading = false;
    }
  }

  search.addEventListener("input", render);
  specialization.addEventListener("change", render);
  list.addEventListener("click", (event) => {
    if (event.target.closest("[data-agent-directory-retry]")) load();
  });
  load();
})();
