(() => {
  "use strict";
  if (document.querySelector(".app-bottom-nav")) return;

  const path = window.location.pathname.toLowerCase();
  const active = path.includes("object-map") ? "map"
    : path.includes("request") ? "requests"
      : path.includes("profile") || path.includes("my-listings") ? "profile"
        : "objects";
  const items = [
    ["objects", "/miniapp.html", "Объекты", '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>'],
    ["map", "/object-map.html", "Карта", '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>'],
    ["requests", "/requests.html", "Заявки", '<path d="M5 4h14v13H9l-4 4z"/><path d="M8 8h8M8 12h6"/>'],
    ["profile", "/profile.html", "Профиль", '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'],
  ];
  const nav = document.createElement("nav");
  nav.className = "app-bottom-nav";
  nav.setAttribute("aria-label", "Основная навигация");
  nav.innerHTML = items.map(([key, href, label, icon]) => `<a href="${href}"${key === active ? ' class="is-active" aria-current="page"' : ""}><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span>${label}</span></a>`).join("");
  document.body.classList.add("has-app-bottom-nav");
  document.body.append(nav);
})();
