(() => {
  const rows = Array.isArray(window.LIBERTERRA_LOCAL_OBJECTS) ? window.LIBERTERRA_LOCAL_OBJECTS : [];
  const mapNode = document.querySelector("#objectsMap");
  const resultNode = document.querySelector("#mapResults");
  const countNode = document.querySelector("#mapCount");
  const searchNode = document.querySelector("#mapSearch");
  const roomsNode = document.querySelector("#mapRooms");
  const typeNode = document.querySelector("#mapType");
  const districtNode = document.querySelector("#mapDistrict");
  const priceNode = document.querySelector("#mapPriceMax");
  const currencyNode = document.querySelector("#mapCurrency");
  const favoritesNode = document.querySelector("#mapFavorites");
  const mobileCountNode = document.querySelector("#mapMobileCount");
  const filterPanel = document.querySelector("#mapFilterPanel");
  const filterToggle = document.querySelector("#mapFilterToggle");
  const filterClose = document.querySelector("#mapFilterClose");
  const selectedNode = document.querySelector("#mapSelectedObject");
  if (!mapNode || !window.L) return;

  const clean = (value) => String(value || "").trim();
  const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";
  const escapeHtml = (value) => clean(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const number = (value) => {
    const parsed = Number.parseFloat(clean(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const photo = (value) => {
    const source = clean(value).split(/\s*(?:\||\n)\s*/).filter(Boolean)[0] || "";
    const filename = source.split(/[?#]/, 1)[0].split("/").pop();
    return /^object_[^/]+\.(?:jpe?g|png|webp)$/i.test(filename || "")
      ? `${PHOTO_DELIVERY_ORIGIN}/uploads/${encodeURIComponent(filename)}`
      : source;
  };
  const statusOk = (row) => clean(row.status).toLowerCase() === "опубликован";
  const priceNumber = (value) => { const found = clean(value).replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/); return found ? Number(found[0].replace(",", ".")) : null; };
  const currency = (value) => /\$|usd|дол/i.test(clean(value)) ? "usd" : "kgs";
  const propertyType = (row) => {
    const value = `${clean(row.object_type)} ${clean(row.segment)} ${clean(row.title)}`.toLowerCase();
    if (/коммер|офис|склад|магазин|помещ/.test(value)) return "commercial";
    if (/участ|земл/.test(value)) return "land";
    if (/дом|коттедж|особняк/.test(value)) return "house";
    return "apartment";
  };
  const favoriteIds = () => { try { return new Set(JSON.parse(localStorage.getItem("liberterra_favorite_objects_v1") || "[]").map(String)); } catch { return new Set(); } };
  async function syncFavorites() {
    if (!window.LiberterraAgentAccess?.hasUserSession()) return;
    try {
      const profile = await window.LiberterraAgentAccess.request("get_user_profile", {});
      const localIds = favoriteIds();
      const remoteIds = new Set((profile.favorite_object_ids || []).map(String));
      await Promise.allSettled([...localIds]
        .filter((id) => !remoteIds.has(id))
        .map((id) => window.LiberterraAgentAccess.request("set_user_favorite", { object_id: id, enabled: true })));
      const ids = new Set([...localIds, ...remoteIds]);
      localStorage.setItem("liberterra_favorite_objects_v1", JSON.stringify([...ids]));
      render();
    } catch (_) {}
  }
  const publishedObjects = rows.filter(statusOk).map((row) => ({
    id: clean(row.id), deal: clean(row.deal).toLowerCase(), rooms: Number.parseInt(clean(row.rooms), 10),
    title: clean(row.title) || "Объект недвижимости", district: clean(row.district) || "Бишкек",
    price: clean(row.price) || "Цена по запросу", lat: number(row.latitude), lng: number(row.longitude),
    priceNumber: priceNumber(row.price), currency: currency(row.price), type: propertyType(row),
    photo: photo(row.photo_url), description: clean(row.description || row.extra), area: clean(row.area), floor: clean(row.floor),
  })).filter((item) => item.id);
  const objects = publishedObjects.filter((item) => item.lat !== null && item.lng !== null);
  const missingGeometryCount = publishedObjects.length - objects.length;

  const state = { deal: "all", query: "", rooms: "all", type: "all", district: "all", priceMax: "", currency: "kgs", favorites: false };
  const FILTERS_KEY = "liberterra_catalog_filters_v1";
  const params = new URLSearchParams(window.location.search);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || "{}"); } catch { saved = {}; }
  const fromFilter = (mapKey, catalogKey, fallback) => params.has(catalogKey) ? params.get(catalogKey) : (saved[catalogKey] ?? fallback);
  state.deal = fromFilter("deal", "deal", "all");
  state.query = fromFilter("query", "query", "");
  state.rooms = fromFilter("rooms", "rooms", "all");
  state.type = fromFilter("type", "propertyType", "all");
  state.district = fromFilter("district", "district", "all");
  state.priceMax = fromFilter("priceMax", "priceMax", "");
  state.currency = fromFilter("currency", "priceCurrency", "kgs");
  state.favorites = ["1", "true", true].includes(params.has("favoritesOnly") ? params.get("favoritesOnly") : saved.favoritesOnly);
  const preservedParams = new URLSearchParams(params);
  const map = L.map(mapNode, { zoomControl: true }).setView([42.8746, 74.5698], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  const layer = L.layerGroup().addTo(map);

  function persistFilters() {
    preservedParams.set("deal", state.deal);
    preservedParams.set("query", state.query);
    preservedParams.set("rooms", state.rooms);
    preservedParams.set("propertyType", state.type);
    preservedParams.set("district", state.district);
    preservedParams.set("priceMax", state.priceMax);
    preservedParams.set("priceCurrency", state.currency);
    if (state.favorites) preservedParams.set("favoritesOnly", "1"); else preservedParams.delete("favoritesOnly");
    const stored = { ...saved, deal: state.deal, query: state.query, rooms: state.rooms, propertyType: state.type, district: state.district, priceMax: state.priceMax, priceCurrency: state.currency, favoritesOnly: state.favorites };
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(stored)); } catch (_) {}
    const query = preservedParams.toString();
    window.history.replaceState(null, "", `${window.location.pathname}?${query}${window.location.hash}`);
    document.querySelectorAll('.object-map-title a, .submission-back').forEach((link) => { link.href = `/?${query}`; });
  }

  const matches = () => objects.filter((item) => {
    if (state.deal !== "all" && item.deal !== state.deal) return false;
    if (state.type !== "all" && item.type !== state.type) return false;
    if (state.district !== "all" && item.district !== state.district) return false;
    if (state.favorites && !favoriteIds().has(String(item.id))) return false;
    const max = Number(state.priceMax);
    if (Number.isFinite(max) && max > 0 && (item.currency !== state.currency || item.priceNumber === null || item.priceNumber > max)) return false;
    if (state.rooms !== "all") {
      if (!Number.isFinite(item.rooms)) return false;
      if (state.rooms === "4+" ? item.rooms < 4 : item.rooms !== Number(state.rooms)) return false;
    }
    const query = state.query.toLowerCase();
    return !query || `${item.title} ${item.district} ${item.description}`.toLowerCase().includes(query);
  });

  const markerPrice = (item) => {
    if (item.priceNumber === null) return "Цена";
    const prefix = item.currency === "usd" ? "$" : "";
    const suffix = item.currency === "kgs" ? " сом" : "";
    if (item.priceNumber >= 1000000) return `${prefix}${(item.priceNumber / 1000000).toFixed(item.priceNumber % 1000000 ? 1 : 0)} млн${suffix}`;
    if (item.priceNumber >= 1000) return `${prefix}${Math.round(item.priceNumber / 1000)} тыс${suffix}`;
    return `${prefix}${item.priceNumber}${suffix}`;
  };
  const markerIcon = (item) => L.divIcon({
    className: "object-price-marker",
    html: `<span>${escapeHtml(markerPrice(item))}</span>`,
    iconSize: [110, 38], iconAnchor: [55, 19],
  });

  function openObject(id) { window.location.href = `/object?id=${encodeURIComponent(id)}`; }

  function selectObject(item) {
    if (!selectedNode) return;
    selectedNode.hidden = false;
    selectedNode.innerHTML = `${item.photo ? `<img src="${escapeHtml(item.photo)}" alt="" loading="lazy" decoding="async">` : '<span class="object-map-no-photo">Фото готовится</span>'}<div><strong>${escapeHtml(item.price)}</strong><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.district)}</small></div><a href="/object?id=${encodeURIComponent(item.id)}">Открыть</a><button type="button" aria-label="Закрыть карточку">×</button>`;
    selectedNode.querySelector("button")?.addEventListener("click", () => { selectedNode.hidden = true; });
  }

  function render() {
    persistFilters();
    const list = matches();
    layer.clearLayers();
    const bounds = [];
    list.forEach((item) => {
      bounds.push([item.lat, item.lng]);
      const marker = L.marker([item.lat, item.lng], { icon: markerIcon(item) }).addTo(layer);
      marker.bindPopup(`${item.photo ? `<img src="${escapeHtml(item.photo)}" alt="">` : ""}<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.district)}</span><b>${escapeHtml(item.price)}</b>${item.area || item.floor ? `<small>${escapeHtml([item.area, item.floor].join(" · "))}</small>` : ""}<a href="/object?id=${encodeURIComponent(item.id)}">Открыть объект</a>`, { className: "object-map-popup" });
      marker.on("click", () => { if (window.matchMedia("(max-width: 760px)").matches) { marker.closePopup(); selectObject(item); } });
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    countNode.textContent = list.length
      ? `${list.length} объектов с точной геометкой${missingGeometryCount ? ` · ${missingGeometryCount} без геометки показаны только в списке` : ""}`
      : missingGeometryCount
        ? `Нет объектов с точной геометкой · ${missingGeometryCount} объектов доступны в списке`
        : "Опубликованных объектов с геометками пока нет";
    if (mobileCountNode) mobileCountNode.textContent = list.length ? `Найдено: ${list.length}` : "Ничего не найдено";
    resultNode.innerHTML = list.length ? list.map((item) => `
      <button class="object-map-card" type="button" data-object-id="${escapeHtml(item.id)}">
        ${item.photo ? `<img src="${escapeHtml(item.photo)}" alt="" loading="lazy" decoding="async">` : '<span class="object-map-no-photo">Фото готовится</span>'}
        <span><strong>${escapeHtml(item.price)}</strong><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.district)}</small></span>
      </button>`).join("") : `<div class="object-map-empty"><strong>Карта готова к работе</strong><span>При добавлении или редактировании объекта выберите точку на карте — после публикации здесь появится маркер с ценой.</span><a href="/add-object.html">Добавить объект с точкой</a></div>`;
  }

  document.querySelectorAll("[data-map-deal]").forEach((button) => button.addEventListener("click", () => {
    state.deal = button.dataset.mapDeal;
    document.querySelectorAll("[data-map-deal]").forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  }));
  searchNode.addEventListener("input", () => { state.query = searchNode.value.trim(); render(); });
  roomsNode.addEventListener("change", () => { state.rooms = roomsNode.value; render(); });
  typeNode.addEventListener("change", () => { state.type = typeNode.value; render(); });
  districtNode.addEventListener("change", () => { state.district = districtNode.value; render(); });
  priceNode.addEventListener("input", () => { state.priceMax = priceNode.value; render(); });
  currencyNode.addEventListener("change", () => { state.currency = currencyNode.value; render(); });
  favoritesNode.addEventListener("change", () => { state.favorites = favoritesNode.checked; render(); });
  resultNode.addEventListener("click", (event) => { const card = event.target.closest("[data-object-id]"); if (card) openObject(card.dataset.objectId); });
  const setFiltersOpen = (open) => {
    filterPanel?.classList.toggle("is-open", open);
    filterToggle?.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("map-filters-open", open);
  };
  filterToggle?.addEventListener("click", () => setFiltersOpen(!filterPanel.classList.contains("is-open")));
  filterClose?.addEventListener("click", () => setFiltersOpen(false));
  [...new Set(publishedObjects.map((item) => item.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru")).forEach((district) => {
    const option = document.createElement("option"); option.value = district; option.textContent = district; districtNode.append(option);
  });
  if (state.district !== "all" && ![...districtNode.options].some((option) => option.value === state.district)) {
    const selectedDistrict = document.createElement("option");
    selectedDistrict.value = state.district;
    selectedDistrict.textContent = state.district;
    districtNode.append(selectedDistrict);
  }
  searchNode.value = state.query;
  roomsNode.value = state.rooms;
  typeNode.value = state.type;
  districtNode.value = [...districtNode.options].some((option) => option.value === state.district) ? state.district : "all";
  priceNode.value = state.priceMax;
  currencyNode.value = state.currency;
  favoritesNode.checked = state.favorites;
  document.querySelectorAll("[data-map-deal]").forEach((button) => button.classList.toggle("is-active", button.dataset.mapDeal === state.deal));
  render();
  window.addEventListener("liberterra:agent-role", syncFavorites);
  window.addEventListener("liberterra:user-registered", syncFavorites);
  window.setTimeout(syncFavorites, 1200);
})();
