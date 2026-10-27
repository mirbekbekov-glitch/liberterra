(() => {
  "use strict";

  const ENDPOINT = "https://hidden-pine-cbff.mirbekbekov.workers.dev/api/analytics";
  const VISITOR_KEY = "liberterra_visitor_id_v1";
  const SESSION_KEY = "liberterra_session_id_v1";
  const SOURCE_KEY = "liberterra_source_v1";
  const CLICKABLE_SELECTOR = "a, button, [role=\"button\"], [role=\"link\"], input[type=\"submit\"]";

  if (!ENDPOINT || window.__liberterraAnalyticsLoaded) return;
  window.__liberterraAnalyticsLoaded = true;
  window.__liberterraPageViewTracked = true;

  function randomId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}_${window.crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
  }

  function storedId(storage, key, prefix) {
    try {
      let value = storage.getItem(key);
      if (!value) {
        value = randomId(prefix);
        storage.setItem(key, value);
      }
      return value;
    } catch (_error) {
      return randomId(prefix);
    }
  }

  function pageName() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith("/object.html") || /\/object\/[^/]+\/?$/.test(path)) return "object";
    if (path.endsWith("/district-map.html") || path.endsWith("/object-map.html")) return "map";
    if (path.endsWith("/requests.html") || path.endsWith("/add-request.html") || path.endsWith("/my-requests.html")) return "requests";
    if (path.endsWith("/profile.html") || path.endsWith("/agent-cabinet.html") || path.endsWith("/agent-public.html")) return "profile";
    if (path.endsWith("/add-object.html") || path.endsWith("/my-listings.html")) return "listings";
    if (path.endsWith("/miniapp.html") || path.endsWith("/index.html") || path === "/") return "catalog";
    return "other";
  }

  function detectedSource() {
    const params = new URLSearchParams(window.location.search);
    const campaignSource = (params.get("utm_source") || "").trim().slice(0, 80);
    if (campaignSource) return campaignSource;
    if (
      params.has("tgWebAppVersion")
      || (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData)
    ) {
      return "telegram";
    }
    if (!document.referrer) return "direct";
    try {
      const referrer = new URL(document.referrer);
      return referrer.origin === window.location.origin ? "internal" : referrer.hostname;
    } catch (_error) {
      return "referral";
    }
  }

  function sourceName() {
    const current = detectedSource();
    try {
      const saved = window.sessionStorage.getItem(SOURCE_KEY);
      if (saved && (current === "internal" || current === "direct")) return saved.slice(0, 80);
      if (!saved || current !== "internal") {
        window.sessionStorage.setItem(SOURCE_KEY, current);
      }
    } catch (_error) {
      return current;
    }
    return current;
  }

  function referrerHost() {
    if (!document.referrer) return "";
    try {
      return new URL(document.referrer).hostname.slice(0, 120);
    } catch (_error) {
      return "";
    }
  }

  function deviceType() {
    const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    if (width <= 680) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  }

  function telegramIdentity() {
    const telegram = window.Telegram && window.Telegram.WebApp;
    const user = telegram && telegram.initDataUnsafe && telegram.initDataUnsafe.user;
    return {
      telegram_id: user && user.id ? String(user.id) : "",
      init_data: telegram && telegram.initData ? telegram.initData : "",
    };
  }

  function objectIdFromUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.origin);
      const queryId = (url.searchParams.get("id") || "").trim();
      if (queryId) return queryId.slice(0, 80);
      const pathMatch = url.pathname.match(/\/object\/([^/?#]+)\/?$/i);
      return pathMatch ? decodeURIComponent(pathMatch[1]).slice(0, 80) : "";
    } catch (_error) {
      return "";
    }
  }

  function currentObjectId() {
    return pageName() === "object"
      ? objectIdFromUrl(`${window.location.pathname}${window.location.search}`)
      : "";
  }

  function objectIdFromElement(element) {
    if (!element) return currentObjectId();
    const card = typeof element.closest === "function"
      ? element.closest("[data-object-url], [data-object-id], [data-card-index]")
      : null;
    if (card) {
      const directId = card.getAttribute && card.getAttribute("data-object-id");
      if (directId) return String(directId).slice(0, 80);
      const objectUrl = card.getAttribute && card.getAttribute("data-object-url");
      const cardId = objectIdFromUrl(objectUrl);
      if (cardId) return cardId;
    }
    const href = element.getAttribute && element.getAttribute("href");
    return objectIdFromUrl(href) || currentObjectId();
  }

  function elementLabel(element) {
    if (!element) return "";
    const label = (
      (element.getAttribute && (
        element.getAttribute("aria-label")
        || element.getAttribute("title")
        || element.getAttribute("value")
      ))
      || element.textContent
      || ""
    );
    return String(label).replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function safeTarget(element) {
    if (!element || !element.getAttribute) return "";
    const href = element.getAttribute("href") || "";
    if (!href) return element.getAttribute("data-action") || "";
    if (/^tel:/i.test(href)) return "tel";
    if (/^(mailto:|sms:)/i.test(href)) return href.split(":")[0].toLowerCase();
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}`.slice(0, 180);
      }
      return `${url.hostname}${url.pathname}`.slice(0, 180);
    } catch (_error) {
      return href.slice(0, 180);
    }
  }

  function clickAction(element) {
    const href = element && element.getAttribute ? (element.getAttribute("href") || "") : "";
    const label = elementLabel(element).toLowerCase();
    if (/^tel:/i.test(href)) return "call";
    if (/(^|\/\/)(t\.me|wa\.me)\//i.test(href) || /whatsapp/i.test(href)) return "message";
    if (objectIdFromElement(element) && pageName() !== "object") return "open_object";
    if (/district-map/i.test(href)) return "open_map";
    if (/requests/i.test(href)) return "open_requests";
    if (/catalog|каталог/i.test(`${href} ${label}`)) return "open_catalog";
    if (
      (element && element.matches && element.matches("[data-object-photo], [data-step]"))
      || /фото|галере/i.test(label)
    ) return "gallery";
    if (
      (element && element.matches && element.matches("input[type=\"submit\"], button[type=\"submit\"]"))
      || /отправ|сохран|подтверд/i.test(label)
    ) return "submit";
    if (/закрыть|close/i.test(label)) return "close";
    return "button";
  }

  const visitorId = storedId(window.localStorage, VISITOR_KEY, "v");
  const sessionId = storedId(window.sessionStorage, SESSION_KEY, "s");
  const source = sourceName();

  function sendEvent(eventType, details = {}) {
    const identity = telegramIdentity();
    const payload = {
      action: "track_event",
      event_type: eventType,
      event_id: randomId("e"),
      visitor_id: visitorId,
      session_id: sessionId,
      page: pageName(),
      path: window.location.pathname.slice(0, 180),
      source,
      referrer: referrerHost(),
      device: deviceType(),
      telegram_id: identity.telegram_id,
      init_data: identity.init_data,
      object_id: String(details.object_id || "").slice(0, 80),
      action_name: String(details.action_name || "").slice(0, 50),
      button_label: String(details.button_label || "").slice(0, 120),
      target: String(details.target || "").slice(0, 180),
    };

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(payload),
      mode: "cors",
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  }

  window.LiberterraAnalytics = {
    trackEvent(eventType, details) {
      if (!["page_view", "click", "registration"].includes(eventType)) return;
      sendEvent(eventType, details);
    },
  };

  window.setTimeout(() => {
    sendEvent("page_view", {
      object_id: currentObjectId(),
      action_name: "view",
    });
  }, 0);

  if (document && typeof document.addEventListener === "function") {
    document.addEventListener("click", (event) => {
      const target = event.target && event.target.nodeType === 3
        ? event.target.parentElement
        : event.target;
      const element = target && typeof target.closest === "function"
        ? target.closest(CLICKABLE_SELECTOR)
        : null;
      if (!element || element.disabled || element.getAttribute("aria-disabled") === "true") return;
      sendEvent("click", {
        object_id: objectIdFromElement(element),
        action_name: clickAction(element),
        button_label: elementLabel(element),
        target: safeTarget(element),
      });
    }, true);
  }
})();
