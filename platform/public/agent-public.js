(() => {
  "use strict";
  const root = document.querySelector("#agentPublicPage");
  if (!root) return;
  const list = root.querySelector("[data-agent-public-objects]");
  const summary = root.querySelector("[data-agent-public-summary]");
  let loading = false;
  const params = new URLSearchParams(location.search);
  const agentRef = params.get("agent") || "";
  const contactPhone = (params.get("phone") || "").replace(/\D/g, "");
  const CATALOG_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLuXrGqbh_4ntwRLXn3_jrbO_MdAYlcBYwJGSM8sTXgpW9u-Rri696yqWiIIvFWIbSREGwoZ5fbYiF/pub?gid=832519304&single=true&output=csv";
  const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const text = (value) => String(value ?? "").trim();
  const isTrue = (value) => value === true || ["true", "1", "yes", "да", "проверен", "проверено"].includes(text(value).toLowerCase());
  const photo = (value) => {
    const source = text(value).split(/\s*(?:\||\n)\s*/).find(Boolean) || "";
    const filename = source.split(/[?#]/, 1)[0].split("/").pop();
    return /^object_[^/]+\.(?:jpe?g|png|webp)$/i.test(filename || "")
      ? `${PHOTO_DELIVERY_ORIGIN}/uploads/${encodeURIComponent(filename)}`
      : source || "/assets/liberterra-mark-adapted.png";
  };
  const phoneDigits = (value) => {
    const digits = text(value).replace(/\D/g, "");
    if (digits.startsWith("996")) return digits;
    if (digits.length === 10 && digits.startsWith("0")) return `996${digits.slice(1)}`;
    if (digits.length === 9) return `996${digits}`;
    return digits;
  };
  const objectWord = (count) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "объект";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "объекта";
    return "объектов";
  };
  const activeSummary = (count) => {
    if (count === 1) return "1 активный объект";
    return `${count} активных ${objectWord(count)}`;
  };
  function parseCsv(source) {
    const rows = [];
    let row = [], value = "", quoted = false;
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (char === '"') {
        if (quoted && source[index + 1] === '"') { value += '"'; index += 1; }
        else quoted = !quoted;
      } else if (char === "," && !quoted) { row.push(value); value = ""; }
      else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && source[index + 1] === "\n") index += 1;
        row.push(value); value = "";
        if (row.some((cell) => cell !== "")) rows.push(row);
        row = [];
      } else value += char;
    }
    if (value || row.length) { row.push(value); rows.push(row); }
    const headers = (rows.shift() || []).map(text);
    return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, text(cells[index])])));
  }
  async function liveCatalogObjects() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${CATALOG_CSV_URL}&v=${Date.now()}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("catalog_unavailable");
      return parseCsv(await response.text()).filter((item) => {
        const status = text(item.status).toLowerCase();
        return ["опубликован", "active", "published"].includes(status);
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function renderObject(item) {
    const price = window.LiberterraListingFormat.price(item.price) || "Цена по запросу";
    return `
      <article class="crm-object-card agent-public-card">
        <a class="crm-object-photo-link" href="/object.html?id=${encodeURIComponent(item.id)}">
          <img class="crm-object-photo" src="${escapeHtml(photo(item.photo_url))}" alt="" loading="lazy">
        </a>
        <div class="crm-object-copy">
          <div class="crm-object-topline">
            <span class="crm-status crm-status-active">Активен</span>
            ${isTrue(item.verified) ? '<span class="crm-review-badge">Проверен</span>' : ""}
          </div>
          <h2><a href="/object.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.title || item.district || "Объект Liberterra")}</a></h2>
          <p class="crm-object-location">${escapeHtml(item.district || "Бишкек")}</p>
          <strong class="crm-object-price">${escapeHtml(price)}${item.per ? ` / ${escapeHtml(item.per)}` : ""}</strong>
          <a class="crm-primary-link" href="/object.html?id=${encodeURIComponent(item.id)}">Смотреть объект</a>
        </div>
      </article>
    `;
  }

  async function load() {
    if (loading) return;
    loading = true;
    summary.textContent = "Загружаем опубликованные объекты...";
    list.innerHTML = "";
    try {
    if (contactPhone) {
      const objects = (await liveCatalogObjects())
        .filter((item) => phoneDigits(item.phone) === contactPhone);
      const name = text(objects[0]?.contact_name || objects[0]?.owner_name) || "Клиент Liberterra";
      document.title = `Объекты пользователя ${name} — Liberterra`;
      root.querySelector("[data-agent-public-title]").textContent = `Объекты пользователя ${name}`;
      root.querySelector("[data-agent-public-summary]").textContent = activeSummary(objects.length);
      list.innerHTML = objects.length
        ? objects.map(renderObject).join("")
        : '<div class="crm-empty"><strong>Активных объектов пока нет</strong><span>Посмотрите другие предложения в каталоге Liberterra.</span></div>';
      return;
    }
    if (!/^[a-f0-9]{24}$/i.test(agentRef)) {
      summary.textContent = "Проверьте ссылку на профиль";
      list.innerHTML = '<div class="crm-empty"><strong>Агент не найден</strong><span>Проверьте ссылку или вернитесь в каталог.</span></div>';
      return;
    }
      const response = await window.LiberterraAgentAccess.publicRequest("get_public_agent_objects", {
        agent_ref: agentRef,
      });
      document.title = `Объекты агента ${response.agent.name} — Liberterra`;
      let avatar = root.querySelector("[data-public-avatar]");
      if (!avatar) { avatar = document.createElement("span"); avatar.dataset.publicAvatar = ""; summary.before(avatar); }
      window.LiberterraAgentPhoto?.show(avatar, response.agent.avatar_url, response.agent.name);
      root.querySelector("[data-agent-public-title]").textContent = `Объекты агента ${response.agent.name}`;
      root.querySelector("[data-agent-public-summary]").textContent =
        `${activeSummary(response.objects.length)} · ${response.agent.specialization === "sale" ? "Продажа" : "Аренда"}`;
      list.innerHTML = response.objects.length
        ? response.objects.map(renderObject).join("")
        : '<div class="crm-empty"><strong>Активных объектов пока нет</strong><span>Посмотрите другие предложения в каталоге Liberterra.</span></div>';
    } catch (error) {
      summary.textContent = "Не удалось загрузить объекты";
      const message = error.name === "AbortError" ? "Сервис отвечает дольше обычного. Попробуйте ещё раз." : error.message;
      list.innerHTML = `<div class="crm-empty"><strong>Не удалось загрузить витрину</strong><span>${escapeHtml(message)}</span><button class="crm-primary-link" type="button" data-agent-public-retry>Повторить</button></div>`;
    } finally {
      loading = false;
    }
  }

  list.addEventListener("click", (event) => {
    if (event.target.closest("[data-agent-public-retry]")) load();
  });
  load();
})();
