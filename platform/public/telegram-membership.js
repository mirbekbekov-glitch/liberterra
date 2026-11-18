(() => {
  "use strict";
  // This gates Telegram entry, not the deliberately public browser catalogue.
  const sessionKey = "liberterra-telegram-session-v1";
  const markerKey = "liberterra-miniapp-entry-v1";
  const authKey = "liberterra-miniapp-auth-v1";
  let cached = null;
  let marked = false;
  let savedAuth = "";
  try {
    cached = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
    marked = sessionStorage.getItem(markerKey) === "1";
    savedAuth = sessionStorage.getItem(authKey) || "";
  } catch (_) {}
  const params = new URLSearchParams(location.hash.slice(1));
  const query = new URLSearchParams(location.search);
  const live = window.Telegram?.WebApp;
  // A real Telegram entry always carries init data; tgWebAppPlatform alone can
  // survive in a copied link and must not lock the public site for good.
  const hasSession = Boolean(live?.initData) ||
    params.has("tgWebAppData") || query.has("tgWebAppData") ||
    Boolean(savedAuth) ||
    Boolean(cached?.initData && Date.now() - Number(cached.savedAt) < 6 * 60 * 60 * 1000);
  const inTelegram = marked || hasSession ||
    params.has("tgWebAppPlatform") || query.has("tgWebAppPlatform");
  if (!inTelegram) return;
  // Only a session-backed entry is remembered, so a stray parameter never
  // keeps the gate up for the rest of the tab's life.
  if (hasSession) {
    try { sessionStorage.setItem(markerKey, "1"); } catch (_) {}
  }
  document.documentElement.classList.add("telegram-membership-locked");
  const style = document.createElement("style");
  style.textContent = `
    html.telegram-membership-locked {overflow:hidden!important}
    html.telegram-membership-locked body > :not(#telegramMembershipGate) {visibility:hidden!important;pointer-events:none!important}
    #telegramMembershipGate {position:fixed;inset:0;z-index:2147483647;overflow:auto;display:grid;place-items:center;background:#f6f3ed;color:#222;padding:24px;box-sizing:border-box;font:16px/1.5 Arial,sans-serif}
    #telegramMembershipGate section {width:100%;max-width:420px;background:white;border-radius:24px;padding:28px;box-sizing:border-box}
    #telegramMembershipGate h1 {font-size:24px;margin:0 0 16px}
    #telegramMembershipGate a,#telegramMembershipGate button {display:block;box-sizing:border-box;width:100%;margin-top:14px;padding:15px;border-radius:14px;text-align:center;text-decoration:none;font:700 16px Arial,sans-serif}
    #telegramMembershipGate a {background:#ff2d39;color:white}
    #telegramMembershipGate button {border:1px solid #ddd;background:white;color:#222;cursor:pointer}
    #telegramMembershipGate button:disabled {opacity:.6;cursor:wait}
    #telegramMembershipGate [hidden] {display:none!important}
  `;
  document.head.append(style);
  const ready = () => {
    const gate = document.createElement("div");
    gate.id = "telegramMembershipGate";
    gate.innerHTML = '<section aria-labelledby="membershipTitle"><h1 id="membershipTitle">Добро пожаловать в Liberterra</h1><p role="status" aria-live="polite"></p><a href="https://t.me/NedvizhimostKGZ" target="_blank" rel="noopener">Подписаться на группу</a><button type="button" data-check>Проверить подписку</button><button type="button" data-open-site hidden>Открыть сайт без Telegram</button></section>';
    document.body.append(gate);
    const status = gate.querySelector("p");
    const button = gate.querySelector("[data-check]");
    const openSite = gate.querySelector("[data-open-site]");
    gate.querySelector("a").addEventListener("click", (event) => {
      const tg = window.Telegram?.WebApp;
      if (typeof tg?.openTelegramLink === "function") {
        event.preventDefault();
        tg.openTelegramLink("https://t.me/NedvizhimostKGZ");
      }
    });
    // Without a Telegram session there is nothing to gate: let the visitor
    // read the public catalogue instead of leaving them on a dead end.
    openSite.addEventListener("click", () => {
      try {
        sessionStorage.removeItem(markerKey);
        sessionStorage.removeItem(authKey);
      } catch (_) {}
      try {
        const url = new URL(location.href);
        [...url.searchParams.keys()]
          .filter((key) => key.toLowerCase().startsWith("tgwebapp"))
          .forEach((key) => url.searchParams.delete(key));
        if (/tgWebApp/i.test(url.hash)) url.hash = "";
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch (_) {}
      document.documentElement.classList.remove("telegram-membership-locked");
      gate.remove();
    });
    let busy = false;
    async function check() {
      if (busy) return;
      busy = true;
      button.disabled = true;
      status.textContent = "⏳ Проверяем подписку…";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);
      try {
        const initData = window.Telegram?.WebApp?.initData || params.get("tgWebAppData") || query.get("tgWebAppData") || savedAuth || cached?.initData || "";
        if (!initData) throw new Error("invalid_session");
        try { sessionStorage.setItem(authKey, initData); } catch (_) {}
        const response = await fetch("/api/telegram-membership", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ init_data: initData }), cache: "no-store", signal: controller.signal,
        });
        const data = await response.json();
        if (response.status === 401) throw new Error("invalid_session");
        if (!response.ok || data.ok !== true || typeof data.subscribed !== "boolean") throw new Error("unavailable");
        openSite.hidden = true;
        if (data.subscribed) {
          document.documentElement.classList.remove("telegram-membership-locked");
          gate.remove();
          return;
        }
        status.textContent = "Для входа через Telegram подпишитесь на нашу группу, затем нажмите «Проверить подписку».";
      } catch (error) {
        if (error.message === "invalid_session") {
          // The session is missing or forged, so the subscription rule does not
          // apply here — this is a plain browser visitor, not a Mini App user.
          try { sessionStorage.removeItem(authKey); } catch (_) {}
          status.textContent = "Не удалось подтвердить Telegram-сессию. Откройте приложение заново через профиль бота — или продолжите на сайте.";
          openSite.hidden = false;
        } else {
          status.textContent = "Не удалось проверить подписку. Попробуйте ещё раз. Доступ откроется после подтверждения.";
        }
      } finally {
        clearTimeout(timeout);
        busy = false;
        button.disabled = false;
      }
    }
    button.addEventListener("click", check);
    check();
    // A restored page must not retain an old successful membership decision.
    window.addEventListener("pageshow", event => { if (event.persisted) location.reload(); });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
