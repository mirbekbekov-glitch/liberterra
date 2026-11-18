const BISHKEK_CENTER = [42.8746, 74.5698];

const ZONES = [
  {
    name: "Север",
    color: "#159A87",
    description: "Ниже ул. Жибек Жолу: Нижняя Ала-Арча, Ак-Босого, Красный Строитель, Мыкан, Дордой, Келек, Ак-Тилек, Ак-Жар, Ак-Бата, Калыс-Ордо.",
    points: [
      [42.958, 74.428],
      [42.966, 74.514],
      [42.948, 74.57],
      [42.944, 74.642],
      [42.928, 74.718],
      [42.898, 74.742],
      [42.887, 74.703],
      [42.889, 74.624],
      [42.886, 74.578],
      [42.895, 74.516],
      [42.886, 74.45],
    ],
    label: [42.925, 74.575],
  },
  {
    name: "Запад",
    color: "#347FB8",
    description: "Рабочий городок, Кызыл-Аскер, Пишпек, Институт земледелия, Достук, Арча-Бешик, Ак-Орго, Ак-Ордо.",
    points: [
      [42.886, 74.45],
      [42.895, 74.516],
      [42.886, 74.578],
      [42.858, 74.56],
      [42.848, 74.538],
      [42.824, 74.548],
      [42.812, 74.525],
      [42.798, 74.51],
      [42.789, 74.455],
      [42.814, 74.405],
      [42.848, 74.398],
    ],
    label: [42.856, 74.483],
  },
  {
    name: "Юг",
    color: "#6DAF35",
    description: "Выше М. Горького: цифровые микрорайоны, Джал, Улан-1/2, Кок-Жар, Асанбай, ж/м Кок-Жар.",
    points: [
      [42.858, 74.56],
      [42.855, 74.622],
      [42.842, 74.648],
      [42.823, 74.687],
      [42.805, 74.704],
      [42.779, 74.684],
      [42.768, 74.618],
      [42.775, 74.555],
      [42.798, 74.51],
      [42.812, 74.525],
      [42.824, 74.548],
      [42.848, 74.538],
    ],
    label: [42.816, 74.59],
  },
  {
    name: "Восток",
    color: "#E88937",
    description: "Восток-5, Тунгуч, Кара-Жыгач, Алтын-Ордо, Рухий-Мурас, Токольдош, Учкун, Аламедин-1.",
    points: [
      [42.889, 74.624],
      [42.898, 74.742],
      [42.873, 74.785],
      [42.842, 74.765],
      [42.823, 74.687],
      [42.842, 74.648],
      [42.855, 74.622],
      [42.874, 74.626],
    ],
    label: [42.863, 74.697],
  },
  {
    name: "Центр",
    color: "#F5333A",
    description: "ул. Гоголя - Молодая Гвардия, Максима Горького - Жибек Жолу, мкр. Юг-2.",
    points: [
      [42.886, 74.578],
      [42.889, 74.624],
      [42.874, 74.626],
      [42.855, 74.622],
      [42.858, 74.56],
      [42.872, 74.552],
    ],
    label: [42.87, 74.585],
  },
  {
    name: "Золотой квадрат",
    color: "#F2B705",
    description: "Юсупа Абдрахманова - пр. Манаса, Жоомарта Боконбаева - пр. Чуй, бульвар Эркиндик.",
    points: [
      [42.877, 74.586],
      [42.8766, 74.612],
      [42.866, 74.612],
      [42.8664, 74.586],
    ],
    label: [42.8715, 74.599],
  },
];

const BOUNDARY_LINES = [
  { name: "Жибек Жолу", points: [[42.887, 74.43], [42.887, 74.745]] },
  { name: "М. Горького", points: [[42.858, 74.51], [42.858, 74.672]] },
  { name: "пр. Чуй", points: [[42.877, 74.565], [42.877, 74.624]] },
  { name: "Боконбаева", points: [[42.866, 74.565], [42.866, 74.624]] },
  { name: "пр. Манаса", points: [[42.862, 74.586], [42.881, 74.586]] },
  { name: "Ю. Абдрахманова", points: [[42.862, 74.612], [42.881, 74.612]] },
  { name: "Молодая Гвардия", points: [[42.85, 74.558], [42.892, 74.558]] },
  { name: "Гоголя", points: [[42.855, 74.622], [42.892, 74.622]] },
];

const LIST_ORDER = ["Центр", "Золотой квадрат", "Юг", "Восток", "Запад", "Север"];

function initMap() {
  const mapElement = document.querySelector("#zoneMap");
  const listElement = document.querySelector("#zoneList");

  if (!mapElement || !listElement || !window.L) return;

  const map = L.map(mapElement, {
    scrollWheelZoom: true,
    zoomControl: true,
  }).setView(BISHKEK_CENTER, 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const bounds = [];
  const zoneLayers = new Map();
  const zoneItems = new Map();
  let activeZoneName = "";

  BOUNDARY_LINES.forEach((line) => {
    L.polyline(line.points, {
      color: "#6E695F",
      weight: 1,
      opacity: 0.22,
      dashArray: "6 6",
    })
      .bindTooltip(line.name, {
        permanent: false,
        sticky: true,
        direction: "top",
      })
      .addTo(map);
  });

  ZONES.forEach((zone) => {
    bounds.push(...zone.points);
    const polygon = L.polygon(zone.points, {
      color: zone.color,
      weight: zone.name === "Золотой квадрат" ? 5 : 2.4,
      opacity: zone.name === "Золотой квадрат" ? 1 : 0.9,
      fillColor: zone.color,
      fillOpacity: zone.name === "Золотой квадрат" ? 0.74 : zone.name === "Центр" ? 0.3 : 0.39,
      className: zone.name === "Золотой квадрат" ? "zone-shape zone-shape-gold" : "zone-shape",
    }).addTo(map);

    zoneLayers.set(zone.name, polygon);
    polygon.bindPopup(`
      <strong>${zone.name}</strong>
      <span>${zone.description}</span>
    `, { className: "zone-popup" });

    polygon.bindTooltip(zone.name, {
      sticky: true,
      direction: "top",
      className: "zone-tooltip",
    });

    polygon.on("mouseover", () => setActiveZone(zone.name, false));
    polygon.on("mouseout", clearActiveZone);
    polygon.on("click", () => {
      setActiveZone(zone.name, true);
      polygon.openPopup();
    });

    const item = document.createElement("button");
    item.type = "button";
    item.className = "zone-item";
    item.dataset.zone = zone.name;
    item.style.order = LIST_ORDER.indexOf(zone.name);
    item.innerHTML = `
      <span class="zone-dot" style="background:${zone.color}"></span>
      <span>
        <strong>${zone.name}</strong>
        <small>${zone.description}</small>
      </span>
    `;
    zoneItems.set(zone.name, item);
    item.addEventListener("mouseenter", () => setActiveZone(zone.name, false));
    item.addEventListener("mouseleave", clearActiveZone);
    item.addEventListener("focus", () => setActiveZone(zone.name, false));
    item.addEventListener("blur", clearActiveZone);
    item.addEventListener("click", () => {
      setActiveZone(zone.name, true);
      map.fitBounds(polygon.getBounds(), { padding: [42, 42] });
      polygon.openPopup();
    });
    listElement.appendChild(item);
  });

  function setActiveZone(zoneName, persist) {
    activeZoneName = persist ? zoneName : activeZoneName;
    zoneLayers.forEach((layer, name) => {
      const zone = ZONES.find((item) => item.name === name);
      const isActive = name === zoneName;
      layer.setStyle({
        color: zone.color,
        weight: isActive ? (name === "Золотой квадрат" ? 6.5 : 4) : (name === "Золотой квадрат" ? 4 : 1.8),
        opacity: isActive ? 1 : 0.62,
        fillOpacity: isActive ? (name === "Золотой квадрат" ? 0.82 : 0.58) : (name === "Золотой квадрат" ? 0.5 : 0.2),
      });
      if (isActive) layer.bringToFront();
    });
    zoneItems.forEach((item, name) => {
      item.classList.toggle("is-active", name === zoneName);
      item.classList.toggle("is-dimmed", name !== zoneName);
    });
  }

  function clearActiveZone() {
    if (activeZoneName) {
      setActiveZone(activeZoneName, true);
      return;
    }
    zoneLayers.forEach((layer, name) => {
      const zone = ZONES.find((item) => item.name === name);
      layer.setStyle({
        color: zone.color,
        weight: name === "Золотой квадрат" ? 5 : 2.4,
        opacity: name === "Золотой квадрат" ? 1 : 0.9,
        fillOpacity: name === "Золотой квадрат" ? 0.74 : name === "Центр" ? 0.3 : 0.39,
      });
    });
    zoneItems.forEach((item) => {
      item.classList.remove("is-active", "is-dimmed");
    });
  }

  map.on("click", (event) => {
    if (!event.originalEvent.target.closest(".leaflet-interactive")) {
      activeZoneName = "";
      clearActiveZone();
    }
  });

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [24, 24] });
  }
}

window.addEventListener("DOMContentLoaded", initMap);
