/* Рабочий стол агента: сделки, задачи на сегодня, плановая комиссия.
   Дополняет существующий блок .crm-home — считает только то, что есть в данных. */
(() => {
  "use strict";
  const root = document.querySelector("#agentCabinet");
  const overview = root?.querySelector('[data-crm-panel="overview"]');
  const home = overview?.querySelector(".crm-home");
  const metrics = home?.querySelector(".crm-home-metrics");
  const nav = root?.querySelector(".crm-tabs");
  const model = window.LiberterraCrmHomeModel;
  if (!home || !metrics || !nav || !model) return;

  const CSS = `
#workspace-overview .crm-home-metric small{display:block;margin-top:2px;font-size:13px;line-height:1.3;color:var(--v20-muted,#6B6560)}
#workspace-overview .crm-home-metric small[data-tone="alert"]{color:#BE2C28}
#workspace-overview .crm-home-metric[data-wide="true"] strong{font-size:24px!important;white-space:nowrap}
#workspace-overview .crm-home-metric strong .unit{display:inline!important;margin-left:4px;font-size:15px!important;font-weight:600!important;color:var(--v20-muted,#6B6560)!important}
#workspace-overview .lt-desk-grid{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(0,1fr);gap:16px;margin-top:16px}
#workspace-overview .lt-desk-panel{background:var(--card,#fff);border:1px solid var(--v20-line,#E3E8EE);border-radius:14px;padding:18px 20px;min-width:0}
#workspace-overview .lt-desk-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:14px}
#workspace-overview .lt-desk-head h3{margin:0;font:600 17px/1.3 'Onest',system-ui,sans-serif;color:var(--v20-ink,#252A31)}
#workspace-overview .lt-desk-head p{margin:3px 0 0;font-size:13px;color:var(--v20-muted,#6B6560)}
#workspace-overview .lt-desk-link{flex:0 0 auto;border:0;background:none;padding:0;font:600 13px/1.3 'Onest',system-ui,sans-serif;color:#BE2C28;cursor:pointer}
#workspace-overview .lt-desk-link:hover{text-decoration:underline}
#workspace-overview .lt-deal{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,.95fr) minmax(0,.8fr) 72px auto;align-items:center;gap:10px;padding:12px 0;border-top:1px solid var(--v20-line,#ECE3E2)}
#workspace-overview .lt-deal:first-of-type{border-top:0}
#workspace-overview .lt-deal b{display:block;font:500 15px/1.3 'Onest',system-ui,sans-serif;color:var(--v20-ink,#252A31);overflow-wrap:anywhere}
#workspace-overview .lt-deal span{display:block;font-size:13px;color:var(--v20-muted,#6B6560)}
#workspace-overview .lt-deal .lt-bar{height:6px;border-radius:3px;background:var(--v20-accent-soft,#F1EDEC);overflow:hidden}
#workspace-overview .lt-deal .lt-bar i{display:block;height:100%;border-radius:3px;background:#BE2C28}
#workspace-overview .lt-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font:500 13px/1.25 'Onest',system-ui,sans-serif;white-space:nowrap}
#workspace-overview .lt-chip::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
#workspace-overview .lt-chip[data-tone="late"]{background:rgba(190,44,40,.12);color:#9E231F}
#workspace-overview .lt-chip[data-tone="today"]{background:rgba(194,65,12,.12);color:#9A3412}
#workspace-overview .lt-chip[data-tone="none"]{background:rgba(107,101,96,.12);color:#5B636E}
#workspace-overview .lt-chip[data-tone="ok"]{background:rgba(31,157,97,.13);color:#18794A}
#workspace-overview .lt-task{display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-top:1px solid var(--v20-line,#ECE3E2)}
#workspace-overview .lt-task:first-of-type{border-top:0}
#workspace-overview .lt-task .lt-dot{flex:0 0 8px;width:8px;height:8px;margin-top:7px;border-radius:50%;background:#1F9D61}
#workspace-overview .lt-task[data-late="true"] .lt-dot{background:#BE2C28}
#workspace-overview .lt-task div{flex:1;min-width:0}
#workspace-overview .lt-task b{display:block;font:500 15px/1.35 'Onest',system-ui,sans-serif;color:var(--v20-ink,#252A31);overflow-wrap:anywhere}
#workspace-overview .lt-task span{display:block;font-size:13px;color:var(--v20-muted,#6B6560)}
#workspace-overview .lt-task time{flex:0 0 auto;font-size:13px;color:var(--v20-muted,#6B6560);white-space:nowrap}
#workspace-overview .lt-desk-empty{margin:0;font-size:14px;color:var(--v20-muted,#6B6560)}
html[data-theme="dark"] #workspace-overview .lt-desk-panel{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14)}
html[data-theme="dark"] #workspace-overview :is(.lt-deal,.lt-task){border-top-color:rgba(255,255,255,.12)}
html[data-theme="dark"] #workspace-overview :is(.lt-deal b,.lt-task b){color:#F1F3F5}
html[data-theme="dark"] #workspace-overview :is(.lt-deal span,.lt-task span,.lt-task time,.lt-desk-empty,.crm-home-metric small){color:#C4CBD4}
html[data-theme="dark"] #workspace-overview .lt-desk-link{color:#F08A82}
html[data-theme="dark"] #workspace-overview .crm-home-metric small[data-tone="alert"]{color:#F08A82}
html[data-theme="dark"] #workspace-overview .lt-chip[data-tone="late"]{background:rgba(240,138,130,.16);color:#F08A82}
html[data-theme="dark"] #workspace-overview .lt-chip[data-tone="ok"]{background:rgba(79,201,140,.16);color:#7BDCAB}
html[data-theme="dark"] #workspace-overview .lt-chip[data-tone="today"]{background:rgba(242,206,138,.16);color:#F2CE8A}
html[data-theme="dark"] #workspace-overview .lt-chip[data-tone="none"]{background:rgba(255,255,255,.1);color:#B9C0CA}
html[data-theme="dark"] #workspace-overview .lt-deal .lt-bar{background:rgba(255,255,255,.12)}
html[data-theme="dark"] #workspace-overview .lt-deal .lt-bar i{background:#F08A82}
@media (max-width:1100px){#workspace-overview .lt-desk-grid{grid-template-columns:minmax(0,1fr)}}
@media (max-width:760px){
#workspace-overview .lt-deal{grid-template-columns:minmax(0,1fr) auto;gap:6px 12px}
#workspace-overview .lt-deal .lt-stage{grid-row:2;grid-column:1}
#workspace-overview .lt-deal .lt-sum{grid-row:2;grid-column:2;text-align:right}
#workspace-overview .lt-deal .lt-bar{grid-row:3;grid-column:1/-1}
#workspace-overview .lt-deal .lt-chip{grid-row:1;grid-column:2}
}`;
  const style = document.createElement("style");
  style.id = "lt-desk-20261118";
  style.textContent = CSS;
  document.head.append(style);

  const state = { records: [], objects: [], tasks: [], tasksReady: false, ready: false, loading: true, requests: null, requestsAll: null, stages: [] };

  // Блок «Рабочий день» из features/deals.js показывает те же числа в более бедном виде.
  // Прячем его только после первой удачной отрисовки, чтобы при ошибке остался хоть один.
  function hideLegacyDay() {
    const day = overview.querySelector(".crm-day");
    if (day && !day.hidden) day.hidden = true;
  }

  function selectTab(key) {
    const tab = nav.querySelector(`[data-crm-tab="${key}"]`);
    if (!tab) return false;
    tab.click();
    tab.scrollIntoView({ block: "nearest" });
    return true;
  }

  // Плитки: те же числа, что и раньше, плюс подпись из данных.
  const tileDefs = [
    ["deals", "Сделки в работе", "deals"],
    ["clients", "Клиенты в работе", "clients"],
    ["today", "Задачи на сегодня", "tasks"],
    ["requests", "Заявки ждут ответа", "requests"],
    ["commission", "Плановая комиссия", "deals"],
  ];
  const tiles = new Map();
  metrics.replaceChildren();
  for (const [key, label, tab] of tileDefs) {
    const item = document.createElement("div");
    item.className = "crm-home-metric";
    item.style.cursor = "pointer";
    item.addEventListener("click", () => selectTab(tab));
    const caption = document.createElement("span");
    caption.textContent = label;
    const value = document.createElement("strong");
    value.className = "num";
    value.textContent = "—";
    const note = document.createElement("small");
    note.textContent = "";
    if (key === "commission") item.dataset.wide = "true";
    item.append(caption, value, note);
    metrics.append(item);
    tiles.set(key, { value, note });
  }

  function panel(title, subtitle, linkLabel, tab) {
    const box = document.createElement("section");
    box.className = "lt-desk-panel";
    const head = document.createElement("div");
    head.className = "lt-desk-head";
    const copy = document.createElement("div");
    const h = document.createElement("h3");
    h.textContent = title;
    const p = document.createElement("p");
    p.textContent = subtitle;
    copy.append(h, p);
    const link = document.createElement("button");
    link.type = "button";
    link.className = "lt-desk-link";
    link.textContent = linkLabel;
    link.addEventListener("click", () => selectTab(tab));
    head.append(copy, link);
    const body = document.createElement("div");
    box.append(head, body);
    return { box, body, subtitle: p };
  }

  const grid = document.createElement("div");
  grid.className = "lt-desk-grid";
  const dealsPanel = panel("Сделки", "Ближайшее действие сверху", "Все сделки →", "deals");
  const todayPanel = panel("Задачи", "Со сроком на сегодня и раньше", "Все задачи →", "tasks");
  grid.append(dealsPanel.box, todayPanel.box);
  (home.querySelector(".crm-home-actions") || metrics).after(grid);

  const NUM = new Intl.NumberFormat("ru-RU");
  const dayStart = (time) => { const d = new Date(time); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const parse = (value) => { const t = Date.parse(value || ""); return Number.isFinite(t) ? t : null; };
  const num = (value) => { const n = Number(String(value ?? "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
  const unit = (currency) => (currency === "USD" ? "$" : "сом");

  function money(sum, currency) {
    return currency === "USD" ? "$" + NUM.format(sum) : NUM.format(sum) + " сом";
  }

  function clientName(id) {
    const found = state.records.find((item) => item.kind === "client" && item.id === id);
    return found ? found.name : "";
  }

  function stageInfo(stage) {
    const list = state.stages.length ? state.stages : [];
    const index = list.findIndex((item) => (item.id || item[0]) === stage);
    const label = index >= 0 ? (list[index].label || list[index][1] || stage) : stage || "—";
    const open = list.filter((item) => !["won", "lost"].includes(item.id || item[0]));
    const place = open.findIndex((item) => (item.id || item[0]) === stage);
    const share = open.length > 1 && place >= 0 ? Math.round(((place + 1) / open.length) * 100) : 0;
    return { label, share };
  }

  function finalStageIds() {
    return state.stages.map((item) => item.id || item[0]).filter((id) => !["won", "lost"].includes(id)).slice(-2);
  }

  function dealRows(now) {
    const end = dayStart(now) + 864e5;
    return state.records
      .filter((item) => item.kind === "deal" && !["won", "lost"].includes(item.stage))
      .map((item) => {
        const at = parse(item.next_action_at);
        const tone = at === null ? "none" : at < now ? "late" : at < end ? "today" : "ok";
        const order = { late: 0, today: 1, none: 2, ok: 3 }[tone];
        return { item, at, tone, order };
      })
      .sort((a, b) => a.order - b.order || (a.at || 8e15) - (b.at || 8e15));
  }

  const CHIP = { late: "Просрочено", today: "Сегодня", none: "Нет следующего шага", ok: "В работе" };

  function renderDeals(rows) {
    dealsPanel.body.replaceChildren();
    if (!state.ready) { empty(dealsPanel.body, "Загружаем сделки…"); return; }
    if (!rows.length) { empty(dealsPanel.body, "Сделок в работе нет. Откройте воронку и заведите первую."); return; }
    for (const row of rows.slice(0, 6)) {
      const line = document.createElement("article");
      line.className = "lt-deal";
      const title = document.createElement("div");
      const name = document.createElement("b");
      name.textContent = row.item.title || "Сделка";
      const who = document.createElement("span");
      who.textContent = clientName(row.item.client_id) || "Без клиента";
      title.append(name, who);
      const stage = stageInfo(row.item.stage);
      const stageCell = document.createElement("span");
      stageCell.className = "lt-stage";
      stageCell.textContent = stage.label;
      const sum = document.createElement("span");
      sum.className = "lt-sum";
      sum.textContent = num(row.item.amount) ? money(num(row.item.amount), row.item.currency) : "—";
      const bar = document.createElement("div");
      bar.className = "lt-bar";
      bar.title = "Этап: " + stage.label;
      const fill = document.createElement("i");
      fill.style.width = stage.share + "%";
      bar.append(fill);
      const chip = document.createElement("span");
      chip.className = "lt-chip";
      chip.dataset.tone = row.tone;
      chip.textContent = CHIP[row.tone];
      line.append(title, stageCell, sum, bar, chip);
      line.addEventListener("click", () => selectTab("deals"));
      line.style.cursor = "pointer";
      dealsPanel.body.append(line);
    }
    if (rows.length > 6) {
      const rest = document.createElement("p");
      rest.className = "lt-desk-empty";
      rest.style.marginTop = "12px";
      rest.textContent = `И ещё ${rows.length - 6} в воронке.`;
      dealsPanel.body.append(rest);
    }
  }

  function empty(node, text) {
    const p = document.createElement("p");
    p.className = "lt-desk-empty";
    p.textContent = text;
    node.append(p);
  }

  function taskRows(now) {
    const end = dayStart(now) + 864e5;
    return state.tasks
      .filter((task) => task.status !== "done")
      .map((task) => ({ task, at: parse(task.due_at) }))
      .filter((row) => row.at !== null && row.at < end)
      .sort((a, b) => a.at - b.at);
  }

  function timeText(at, now) {
    const date = new Date(at);
    if (at < dayStart(now)) {
      const days = Math.round((dayStart(now) - dayStart(at)) / 864e5);
      return days === 1 ? "вчера" : `${days} дн. назад`;
    }
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  function renderTasks(rows, now) {
    todayPanel.body.replaceChildren();
    if (!state.tasksReady) { empty(todayPanel.body, "Загружаем задачи…"); return; }
    if (!rows.length) { empty(todayPanel.body, "На сегодня задач нет. Можно заняться воронкой."); return; }
    for (const row of rows.slice(0, 6)) {
      const line = document.createElement("article");
      line.className = "lt-task";
      if (row.at < now) line.dataset.late = "true";
      const dot = document.createElement("i");
      dot.className = "lt-dot";
      const body = document.createElement("div");
      const name = document.createElement("b");
      name.textContent = row.task.title || "Задача";
      const who = document.createElement("span");
      who.textContent = clientName(row.task.client_id) || (row.at < now ? "Просрочена" : "Сегодня");
      body.append(name, who);
      const when = document.createElement("time");
      when.dateTime = row.task.due_at || "";
      when.textContent = timeText(row.at, now);
      line.append(dot, body, when);
      line.addEventListener("click", () => selectTab("tasks"));
      line.style.cursor = "pointer";
      todayPanel.body.append(line);
    }
    if (rows.length > 6) {
      const rest = document.createElement("p");
      rest.className = "lt-desk-empty";
      rest.style.marginTop = "12px";
      rest.textContent = `И ещё ${rows.length - 6} задач со сроком.`;
      todayPanel.body.append(rest);
    }
  }

  function setTile(key, value, note, tone) {
    const tile = tiles.get(key);
    if (!tile) return;
    if (value !== undefined) tile.value.textContent = value;
    tile.note.textContent = note;
    if (tone) tile.note.dataset.tone = tone; else delete tile.note.dataset.tone;
  }

  function render() {
    const now = Date.now();
    const summary = model.summarize(state, now);
    const rows = dealRows(now);
    const tasks = taskRows(now);
    const late = rows.filter((row) => row.tone === "late").length;
    const lateTasks = tasks.filter((row) => row.at < now).length;
    const openTasks = state.tasks.filter((task) => task.status !== "done").length;

    setTile("deals", state.ready ? String(summary.counts.activeDeals) : "—",
      !state.ready ? "" : late ? `${late} с просроченным действием` : rows.length ? "все действия в графике" : "нет сделок в работе",
      late ? "alert" : "");
    setTile("clients", state.ready ? String(summary.counts.activeClients) : "—",
      !state.ready ? "" : summary.counts.plannedShowings ? `показов запланировано: ${summary.counts.plannedShowings}` : `собственников: ${summary.counts.owners}`);
    setTile("today", state.tasksReady ? String(tasks.length) : "—",
      !state.tasksReady ? "" : lateTasks ? `${lateTasks} просрочено` : `всего открыто: ${openTasks}`,
      lateTasks ? "alert" : "");
    setTile("requests", state.requests === null ? "—" : String(state.requests),
      state.requestsAll === null || state.requestsAll === undefined ? "" : `доступно всего: ${state.requestsAll}`);

    // Плановая комиссия: сумма поля по сделкам в работе, по каждой валюте отдельно.
    const sums = new Map();
    let filled = 0;
    for (const row of rows) {
      const value = num(row.item.planned_commission);
      if (!value) continue;
      filled += 1;
      const currency = row.item.currency === "USD" ? "USD" : "KGS";
      sums.set(currency, (sums.get(currency) || 0) + value);
    }
    const parts = [...sums.entries()].sort((a, b) => b[1] - a[1]);
    const tile = tiles.get("commission");
    if (!state.ready || !parts.length) tile.value.replaceChildren(document.createTextNode("—"));
    else {
      const span = document.createElement("span");
      span.className = "unit";
      span.textContent = unit(parts[0][0]);
      tile.value.replaceChildren(document.createTextNode(NUM.format(parts[0][1])), span);
    }
    const extra = parts.slice(1).map(([currency, sum]) => money(sum, currency)).join(" · ");
    setTile("commission", undefined, !state.ready ? "" : !rows.length ? "сделок в работе нет"
      : !filled ? "не указана ни в одной сделке"
      : extra ? `${extra} · указана по ${filled} из ${rows.length}`
      : `указана по ${filled} из ${rows.length} сделок`);

    const finals = finalStageIds();
    const atFinal = rows.filter((row) => finals.includes(row.item.stage)).length;
    dealsPanel.subtitle.textContent = atFinal
      ? `Ближайшее действие сверху · ${atFinal} на финальной стадии`
      : "Ближайшее действие сверху";

    renderDeals(rows);
    renderTasks(tasks, now);
    if (state.ready) hideLegacyDay();
  }

  window.addEventListener("liberterra:crm-loading", () => { state.ready = false; state.loading = true; render(); });
  window.addEventListener("liberterra:crm-data", (event) => {
    state.records = event.detail?.records || [];
    state.objects = event.detail?.objects || [];
    state.stages = event.detail?.dealStages || [];
    state.requests = Number.isFinite(event.detail?.requestsOverdue) ? Math.max(event.detail.requestsOverdue, event.detail.requestsAvailable || 0) : null;
    state.requestsAll = Number.isFinite(event.detail?.requestsAvailable) ? event.detail.requestsAvailable : null;
    state.ready = event.detail?.ready === true;
    state.loading = false;
    render();
  });
  window.addEventListener("liberterra:tasks-data", (event) => {
    state.tasksReady = event.detail?.ready !== false;
    state.tasks = state.tasksReady ? event.detail?.tasks || [] : [];
    render();
  });
  render();
})();
