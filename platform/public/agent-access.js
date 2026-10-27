(() => {
  "use strict";
  const SHOW_AGENT_COMMISSION_BADGES = false;

  const AGENT_API_URL = "https://script.google.com/macros/s/AKfycbwCAQhQpNHsSbDkATAAjkibTmRfAu8xn7ymY-L4KE8hQvNa7m7FQBcoMQDQyqUsrz8/exec";
  const BOT_AGENT_LINK = "https://t.me/Liberterra_kg_bot?start=agent";
  const SITE_ORIGIN = window.location.origin;
  const MAX_DOCUMENT_PHOTO_SIZE = 3 * 1024 * 1024;
  const ASSET_VERSION = "20260908-agents-mobile-entry-1";
  const MAIN_STYLESHEET_URL = `${SITE_ORIGIN}/style.css?v=${ASSET_VERSION}`;
  const FONT_STYLESHEET_URL = "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Manrope:wght@700;800&display=swap";

  const telegram = window.Telegram?.WebApp || null;
  const TELEGRAM_SESSION_KEY = "liberterra-telegram-session-v1";
  let telegramUser = telegram?.initDataUnsafe?.user || null;
  let initData = typeof telegram?.initData === "string" ? telegram.initData.trim() : "";
  try {
    if (initData && telegramUser?.id) {
      window.sessionStorage.setItem(TELEGRAM_SESSION_KEY, JSON.stringify({
        initData,
        user: telegramUser,
        savedAt: Date.now(),
      }));
    } else {
      const cached = JSON.parse(window.sessionStorage.getItem(TELEGRAM_SESSION_KEY) || "null");
      if (cached?.initData && cached?.user?.id && Date.now() - Number(cached.savedAt || 0) < 6 * 60 * 60 * 1000) {
        initData = String(cached.initData).trim();
        telegramUser = cached.user;
      }
    }
  } catch (_error) {
    // Telegram may disable storage in privacy mode; the live session still works.
  }
  const isTelegramSession = Boolean(initData && telegramUser?.id);
  const state = {
    role: "guest",
    checking: isTelegramSession,
    checkError: "",
    isTelegramSession,
    isWebSession: false,
    user: telegramUser,
    access: null,
    specializationRequired: false,
  };

  let agentModal = null;
  let agentForm = null;
  let termsModal = null;
  let termsForm = null;
  let specializationModal = null;
  let specializationForm = null;
  let previousFocus = null;
  let termsPreviousFocus = null;

  function normalize(value) {
    return String(value || "").trim();
  }

  function isValidWorkPhone(value) {
    const phone = normalize(value);
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 9
      && digits.length <= 15
      && /^[0-9+().\-\s]+$/.test(phone);
  }

  function ensureAgentStyles() {
    const stylesheetLinks = [...document.querySelectorAll('link[rel="stylesheet"]')];
    const mainStylesheet = stylesheetLinks.find((link) => {
      try {
        return new URL(link.href, document.baseURI).pathname.endsWith("/style.css");
      } catch (_error) {
        return false;
      }
    });
    if (mainStylesheet) {
      mainStylesheet.dataset.liberterraMainStyles = "true";
    } else {
      const isLocalPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname);
      const expectedMainUrl = isLocalPreview
        ? new URL(`style.css?v=${ASSET_VERSION}`, document.baseURI).href
        : MAIN_STYLESHEET_URL;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = expectedMainUrl;
      link.dataset.liberterraMainStyles = "true";
      document.head.append(link);
    }

    const hasBrandFonts = stylesheetLinks.some((link) => link.href.includes("fonts.googleapis.com")
      && link.href.includes("Golos")
      && link.href.includes("Manrope"));
    if (!hasBrandFonts) {
      const fonts = document.createElement("link");
      fonts.rel = "stylesheet";
      fonts.href = FONT_STYLESHEET_URL;
      fonts.dataset.liberterraBrandFonts = "true";
      document.head.append(fonts);
    }

  }

  function escapeHtml(value) {
    return normalize(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeRole(value) {
    const role = normalize(value).toLowerCase();
    const aliases = {
      guest: "guest",
      pending: "pending",
      approved: "approved",
      rejected: "rejected",
      "на проверке": "pending",
      "одобрен": "approved",
      "отклонён": "rejected",
      "отклонен": "rejected",
    };
    return aliases[role] || "guest";
  }

  function normalizeAgentSpecialization(value) {
    const specialization = normalize(value).toLowerCase();
    const aliases = {
      rent: "rent",
      "аренда": "rent",
      sale: "sale",
      "продажа": "sale",
    };
    return aliases[specialization] || "";
  }

  function specializationAllowsDeal(specialization, deal) {
    const normalizedSpecialization = normalizeAgentSpecialization(specialization);
    const normalizedDeal = normalize(deal).toLowerCase();
    if (normalizedSpecialization === "sale") return normalizedDeal === "продажа";
    if (normalizedSpecialization === "rent") return normalizedDeal === "аренда";
    return false;
  }

  function hasAgentCommission(item) {
    const deal = normalize(item?.deal).toLowerCase();
    return agentTermsAccepted() && specializationAllowsDeal(state.access?.specialization, deal);
  }

  function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function sanitizeAgentAccess(value) {
    const commission = value?.commission;
    const terms = value?.terms;
    const specialization = normalizeAgentSpecialization(value?.specialization);
    const rates = {
      saleRate: finiteNumber(commission?.sale_rate),
      rentRate: finiteNumber(commission?.rent_rate),
      platformShare: finiteNumber(commission?.platform_share),
      listingShare: finiteNumber(commission?.listing_share),
      closingShare: finiteNumber(commission?.closing_share),
    };
    const sharedRates = [rates.platformShare, rates.listingShare, rates.closingShare];
    if (!["rent", "sale"].includes(specialization)) return null;
    if (sharedRates.some((rate) => rate === null || rate < 0 || rate > 1)) return null;
    if (specialization === "sale" && (rates.saleRate === null || rates.saleRate < 0 || rates.saleRate > 1)) return null;
    if (specialization === "rent" && (rates.rentRate === null || rates.rentRate < 0 || rates.rentRate > 1)) return null;
    if (!normalize(terms?.title) || !normalize(terms?.intro) || !Array.isArray(terms?.sections)) return null;

    return {
      specialization,
      commission: rates,
      terms: {
        title: normalize(terms.title),
        intro: normalize(terms.intro),
        sections: terms.sections.filter((section) => section && typeof section === "object"),
        agreementUrl: safeExternalUrl(terms.agreement_url),
        accepted: terms.accepted === true || ["true", "да", "yes", "1"].includes(normalize(terms.accepted).toLowerCase()),
        acceptedAt: normalize(terms.accepted_at),
      },
      labels: {
        otherAgentNote: normalize(value?.labels?.other_agent_note),
      },
      otherAgentObjectIds: Array.isArray(value?.other_agent_object_ids)
        ? value.other_agent_object_ids.map(normalize).filter(Boolean)
        : [],
      verifiedContractObjectIds: Array.isArray(value?.verified_contract_object_ids)
        ? value.verified_contract_object_ids.map(normalize).filter(Boolean)
        : [],
    };
  }

  function agentTermsAccepted() {
    return state.access?.terms?.accepted === true;
  }

  function hasVerifiedContract(item) {
    if (state.role !== "approved" || !state.access || !agentTermsAccepted()) return false;
    const objectId = normalize(item?.id);
    return Boolean(objectId) && state.access.verifiedContractObjectIds.includes(objectId);
  }

  function contractVerifiedBadgeHtml(item) {
    if (!hasVerifiedContract(item)) return "";
    return '<span class="contract-verified-badge" aria-label="Договор с собственником проверен"><span aria-hidden="true">✓</span> Договор проверен</span>';
  }

  function safeExternalUrl(value) {
    try {
      const url = new URL(normalize(value));
      return url.protocol === "https:" ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function numberFromText(value) {
    const source = normalize(value).replace(/\u00a0/g, " ");
    const match = source.match(/-?\d[\d\s.,]*/);
    if (!match) return null;
    let token = match[0].replace(/\s/g, "");
    const lastComma = token.lastIndexOf(",");
    const lastDot = token.lastIndexOf(".");
    const separator = Math.max(lastComma, lastDot);
    if (separator > -1 && token.length - separator - 1 <= 2) {
      token = token.slice(0, separator).replace(/[.,]/g, "") + "." + token.slice(separator + 1);
    } else {
      token = token.replace(/[.,]/g, "");
    }
    const parsed = Number(token);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function priceNumber(item) {
    const normalizedNumber = finiteNumber(item?.priceNumber);
    return normalizedNumber && normalizedNumber > 0 ? normalizedNumber : numberFromText(item?.price);
  }

  function areaNumber(item) {
    const normalizedNumber = finiteNumber(item?.areaNumber);
    return normalizedNumber && normalizedNumber > 0 ? normalizedNumber : numberFromText(item?.area);
  }

  function currencyFromItem(item) {
    const explicit = normalize(item?.priceCurrency).toLowerCase();
    if (explicit === "usd" || explicit === "$") return "usd";
    if (explicit === "kgs" || explicit.includes("сом")) return "kgs";
    const price = normalize(item?.price).toLowerCase();
    if (price.includes("$") || price.includes("usd")) return "usd";
    if (price.includes("сом") || price.includes("kgs")) return "kgs";
    return "";
  }

  function isPerSquareMeter(item) {
    return /(?:м²|м2|m²|m2)/i.test(normalize(item?.per));
  }

  function formatMoney(value, currency) {
    const amount = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
      .format(Math.round(value))
      .replace(/\u00a0/g, " ");
    return currency === "usd" ? `${amount}` : `${amount} сом`;
  }

  function fallbackCommissionLabel() {
    const share = state.access?.commission?.closingShare;
    const percent = Number.isFinite(share) ? Math.round(share * 100) : null;
    return percent === null ? "Доля по договору" : `${percent}% от комиссии`;
  }

  function calculateCommission(item) {
    if (!hasAgentCommission(item) || !state.access) return null;
    const deal = normalize(item?.deal).toLowerCase();
    const price = priceNumber(item);
    const detectedCurrency = currencyFromItem(item);
    const expectedCurrency = deal === "продажа" ? "usd" : "kgs";
    const currency = detectedCurrency || expectedCurrency;
    let baseAmount = price;
    if (deal === "аренда" && isPerSquareMeter(item)) {
      const area = areaNumber(item);
      baseAmount = price && area ? price * area : null;
    }

    const rate = deal === "продажа"
      ? state.access.commission.saleRate
      : state.access.commission.rentRate;
    if (!Number.isFinite(rate)) return null;
    if (!baseAmount) {
      return {
        amount: null,
        currency,
        label: fallbackCommissionLabel(),
        closingAgentAmount: null,
        listingAgentAmount: null,
        totalCommission: null,
      };
    }

    const totalCommission = baseAmount * rate;
    const agentPool = totalCommission * (1 - state.access.commission.platformShare);
    const closingAgentAmount = agentPool * state.access.commission.closingShare;
    const listingAgentAmount = agentPool * state.access.commission.listingShare;
    return {
      amount: closingAgentAmount,
      currency,
      label: formatMoney(closingAgentAmount, currency),
      closingAgentAmount,
      listingAgentAmount,
      totalCommission,
    };
  }

  function isOtherAgentObject(item) {
    const objectId = normalize(item?.id);
    return Boolean(objectId && state.access?.otherAgentObjectIds.includes(objectId));
  }

  function commissionBadgeHtml(item, context = "card") {
    if (!SHOW_AGENT_COMMISSION_BADGES) return "";
    if (state.role !== "approved" || !state.access) return "";
    const commission = calculateCommission(item);
    if (!commission) return "";
    const safeContext = ["card", "modal", "object"].includes(context) ? context : "card";
    return `
      <div class="agent-commission agent-commission-${safeContext}" aria-label="Комиссия агенту: ${escapeHtml(commission.label)}, ориентировочно">
        <div class="agent-commission-main">
          <span>Комиссия агенту</span>
          <div class="agent-commission-value">
            <span class="agent-commission-amount">
              <strong>${escapeHtml(commission.label)}</strong>
              <small class="agent-commission-estimate">ориентировочно</small>
            </span>
            <button
              class="agent-commission-info"
              type="button"
              data-agent-terms-open
              aria-label="Как рассчитывается комиссия"
              title="Итоговая комиссия считается от финальной цены сделки. Цена может измениться в торге — доли пересчитываются от фактической суммы."
            >i</button>
          </div>
        </div>
        ${isOtherAgentObject(item) && state.access.labels.otherAgentNote ? `<small>${escapeHtml(state.access.labels.otherAgentNote)}</small>` : ""}
      </div>
    `;
  }

  function termsSectionHtml(section) {
    const title = normalize(section?.title);
    const paragraphs = Array.isArray(section?.paragraphs) ? section.paragraphs : [];
    const bullets = Array.isArray(section?.bullets) ? section.bullets : [];
    const after = Array.isArray(section?.after) ? section.after : [];
    if (!title) return "";
    return `
      <section class="agent-terms-section">
        <h3>${escapeHtml(title)}</h3>
        ${paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
        ${bullets.length ? `<ul>${bullets.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul>` : ""}
        ${after.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
      </section>
    `;
  }

  function percentLabel(value) {
    return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "";
  }

  function agentTermsSplitHtml() {
    const commission = state.access?.commission;
    const listingShare = Number.isFinite(commission?.listingShare) ? commission.listingShare : 0.5;
    const closingShare = Number.isFinite(commission?.closingShare) ? commission.closingShare : 0.5;
    const listingPercent = percentLabel(listingShare);
    const closingPercent = percentLabel(closingShare);
    const listingWidth = Math.max(0, Math.min(100, listingShare * 100));
    const closingWidth = Math.max(0, Math.min(100, closingShare * 100));
    return `
      <section class="agent-terms-visual-section" aria-labelledby="agentTermsSplitTitle">
        <h3 class="agent-terms-eyebrow" id="agentTermsSplitTitle">КАК ДЕЛИТСЯ</h3>
        <div class="agent-terms-card agent-commission-split-card">
          <div class="agent-commission-split-bar" role="img" aria-label="${escapeHtml(listingPercent)} агенту, который привёл объект, и ${escapeHtml(closingPercent)} агенту, который закрыл сделку">
            <strong class="agent-split-listing" style="width:${listingWidth}%">${escapeHtml(listingPercent)}</strong>
            <strong class="agent-split-closing" style="width:${closingWidth}%">${escapeHtml(closingPercent)}</strong>
          </div>
          <div class="agent-commission-split-labels">
            <div>
              <strong>Привёл объект</strong>
              <span>Разместил его в базе</span>
            </div>
            <div>
              <strong>Закрыл сделку</strong>
              <span>Привёл клиента</span>
            </div>
          </div>
          <p class="agent-commission-full-share">Ведёте объект от размещения до сделки сами, получаете обе доли, <strong>100%.</strong></p>
        </div>
      </section>
    `;
  }

  function agentTermsExampleHtml() {
    const specialization = state.access?.specialization;
    const isSale = specialization === "sale";
    const baseAmount = isSale ? 100000 : 45000;
    const currency = isSale ? "usd" : "kgs";
    const configuredRate = isSale
      ? state.access?.commission?.saleRate
      : state.access?.commission?.rentRate;
    const rate = Number.isFinite(configuredRate) ? configuredRate : (isSale ? 0.02 : 0.5);
    const closingShare = Number.isFinite(state.access?.commission?.closingShare)
      ? state.access.commission.closingShare
      : 0.5;
    const totalCommission = baseAmount * rate;
    const closingAmount = totalCommission * closingShare;
    const rateText = percentLabel(rate);
    const title = isSale ? "Продажа за $100 000" : "Аренда за 45 000 сом/мес";
    const commissionText = isSale
      ? `Комиссия, ${rateText} от стоимости`
      : `Комиссия, ${rateText} от первого месяца`;
    return `
      <section class="agent-terms-visual-section" aria-labelledby="agentTermsExampleTitle">
        <h3 class="agent-terms-eyebrow" id="agentTermsExampleTitle">ПРИМЕР</h3>
        <div class="agent-terms-card agent-commission-example">
          <dl>
            <div>
              <dt>${escapeHtml(title)}</dt>
              <dd>${escapeHtml(formatMoney(baseAmount, currency))}</dd>
            </div>
            <div>
              <dt>${escapeHtml(commissionText)}</dt>
              <dd>${escapeHtml(formatMoney(totalCommission, currency))}</dd>
            </div>
            <div class="agent-example-result">
              <dt>Ваша доля за закрытие сделки</dt>
              <dd>${escapeHtml(formatMoney(closingAmount, currency))}</dd>
            </div>
          </dl>
          <p>Итоговая комиссия считается от финальной цены сделки. Цена может измениться в торге — доли пересчитываются от фактической суммы.</p>
        </div>
      </section>
    `;
  }

  function agentTermsScenariosHtml() {
    const listingShare = Number.isFinite(state.access?.commission?.listingShare)
      ? state.access.commission.listingShare
      : 0.5;
    const closingShare = Number.isFinite(state.access?.commission?.closingShare)
      ? state.access.commission.closingShare
      : 0.5;
    const listingPercent = percentLabel(listingShare);
    const closingPercent = percentLabel(closingShare);
    return `
      <section class="agent-terms-visual-section" aria-labelledby="agentTermsScenariosTitle">
        <h3 class="agent-terms-eyebrow" id="agentTermsScenariosTitle">ВАША ДОЛЯ В РАЗНЫХ СЛУЧАЯХ</h3>
        <div class="agent-terms-card agent-commission-scenarios">
          <div class="agent-commission-scenario">
            <strong>${escapeHtml(closingPercent)}</strong>
            <div>
              <b>Объект чужой, закрыли вы</b>
              <p>Вторая половина достаётся агенту, который привёл объект.</p>
            </div>
          </div>
          <div class="agent-commission-scenario">
            <strong>${escapeHtml(listingPercent)}</strong>
            <div>
              <b>Объект ваш, закрыл другой агент</b>
              <p>Вы получаете свою долю, даже если сделку вели не вы.</p>
            </div>
          </div>
          <div class="agent-commission-scenario">
            <strong>100%</strong>
            <div>
              <b>Объект ваш и сделка ваша</b>
              <p>Вы получаете обе доли комиссии.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function agentTermsContentHtml(terms) {
    const conditions = terms.sections.find((section) => normalize(section?.title) === "УСЛОВИЯ РАБОТЫ");
    return `
      ${agentTermsSplitHtml()}
      ${agentTermsExampleHtml()}
      ${agentTermsScenariosHtml()}
      ${conditions ? termsSectionHtml(conditions) : ""}
    `;
  }

  function termsModalHtml() {
    const terms = state.access?.terms;
    if (!terms) return "";
    const accepted = agentTermsAccepted();
    return `
      <div class="agent-modal agent-terms-modal" id="agentTermsModal" hidden>
        <button class="agent-modal-backdrop" type="button" data-agent-terms-close aria-label="Закрыть условия"></button>
        <section class="agent-modal-panel agent-terms-panel" role="dialog" aria-modal="true" aria-labelledby="agentTermsTitle">
          <button class="agent-modal-close" type="button" data-agent-terms-close aria-label="Закрыть">×</button>
          <div class="agent-modal-scroll agent-terms-scroll">
            <header class="agent-modal-heading">
              <span class="agent-modal-kicker">Liberterra для агентов</span>
              <h2 id="agentTermsTitle">${escapeHtml(terms.title)}</h2>
              <p>${escapeHtml(terms.intro)}</p>
            </header>
            <div class="agent-terms-content">
              ${agentTermsContentHtml(terms)}
            </div>
            ${accepted ? `
              <div class="agent-terms-confirmed" role="status">
                <strong>Условия приняты</strong>
                <p>Вы подтвердили, что ознакомились с условиями и согласны работать по ним.${terms.acceptedAt ? ` Дата: ${escapeHtml(terms.acceptedAt)}.` : ""}</p>
              </div>
              <div class="agent-terms-actions">
                <button class="agent-terms-button" type="button" data-agent-terms-close>Закрыть</button>
                <a class="agent-catalog-button" href="#catalogGrid" data-agent-catalog-link>Перейти в каталог</a>
              </div>
            ` : `
              <form class="agent-terms-consent-form" id="agentTermsConsentForm" novalidate>
                <label class="agent-terms-consent">
                  <input type="checkbox" name="terms_accepted" value="true" data-agent-terms-checkbox>
                  <span>Я ознакомился с условиями и согласен работать на этих условиях.</span>
                </label>
                <p class="agent-terms-error" data-agent-terms-error role="alert" aria-live="polite" hidden></p>
                <button class="agent-terms-submit" type="submit" disabled aria-disabled="true">Подтвердить и продолжить</button>
                ${terms.agreementUrl ? `<a class="agent-agreement-link" href="${escapeHtml(terms.agreementUrl)}" target="_blank" rel="noopener">Открыть договор с Liberterra</a>` : ""}
              </form>
            `}
          </div>
        </section>
      </div>
    `;
  }

  const DEFAULT_API_TIMEOUT_MS = 15000;
  const OBJECT_WRITE_TIMEOUT_MS = 45000;
  const PUBLIC_AGENT_PROFILE_TIMEOUT_MS = 30000;
  const PUBLIC_AGENT_DIRECTORY_TIMEOUT_MS = 30000;

  async function apiRequest(payload, timeoutMs = DEFAULT_API_TIMEOUT_MS) {
    if (!AGENT_API_URL) throw new Error("Сервис регистрации пока не подключён.");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(AGENT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return JSON.parse(text || "{}");
    } catch (error) {
      if (error?.name === "AbortError") {
        if (["delete_user_object", "update_agent_object"].includes(payload.action)) {
          const uncertain = new Error("Ответ не получен вовремя. Операция могла выполниться. Обновите список объявлений и проверьте статус перед повтором.");
          uncertain.code = "operation_status_unknown";
          throw uncertain;
        }
        throw new Error("Сервис отвечает дольше обычного. Попробуйте ещё раз.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function authenticatedRequest(action, data = {}) {
    if (!isTelegramSession || !telegramUser?.id || !initData) {
      const response = await fetch("/api/account-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ ...data, action }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        const error = new Error(result?.message || (result?.error === "registration_required" ? "Войдите в аккаунт на сайте." : "Не удалось выполнить запрос."));
        error.code = result?.error || "request_failed";
        throw error;
      }
      state.isWebSession = true;
      return result;
    }
    const response = await apiRequest({
      ...data,
      action,
      telegram_id: Number(telegramUser.id),
      init_data: initData,
    }, ["delete_user_object", "update_agent_object", "set_agent_photo"].includes(action) ? OBJECT_WRITE_TIMEOUT_MS : DEFAULT_API_TIMEOUT_MS);
    if (!response?.ok) {
      const error = new Error(response?.message || "Не удалось выполнить запрос.");
      error.code = response?.error || "request_failed";
      throw error;
    }
    return response;
  }

  async function ensureModerationNotification(objectId, updateResponse) {
    if (updateResponse?.moderation_channel === "website") return updateResponse;
    if (updateResponse?.notification_sent === true) return updateResponse;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), DEFAULT_API_TIMEOUT_MS);
    try {
      const response = await fetch("/api/moderation-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_id: objectId,
          telegram_init_data: initData,
        }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true || result.notification_sent !== true) {
        const error = new Error("Изменения сохранены, но уведомление модератору не отправлено. Попробуйте ещё раз.");
        error.code = result.error || "notification_failed";
        throw error;
      }
      return result;
    } catch (error) {
      if (error?.name === "AbortError") {
        const timeoutError = new Error("Изменения сохранены, но уведомление модератору не отправлено вовремя. Попробуйте ещё раз.");
        timeoutError.code = "notification_timeout";
        throw timeoutError;
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const publicReadsInFlight = new Map();

  async function fetchPublicRead(action, data, timeoutMs) {
    const url = new URL(AGENT_API_URL);
    url.searchParams.set("action", action);
    if (action === "get_public_agent_objects") url.searchParams.set("agent_ref", String(data.agent_ref || ""));
    const deadline = Date.now() + timeoutMs;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      const timer = window.setTimeout(() => controller.abort(), Math.min(14000, remaining));
      try {
        url.searchParams.set("public_read", `${Date.now()}-${attempt}`);
          const response = await fetch(url.toString(), { method: "GET", cache: "no-store", redirect: "follow", signal: controller.signal });
        if (!response.ok) {
          const error = new Error("Сервис временно недоступен. Попробуйте ещё раз.");
          error.retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
          throw error;
        }
        const raw = await response.text();
        let result;
        try { result = JSON.parse(raw); } catch (_) {
          const error = new Error("Сервис вернул неполный ответ. Попробуйте ещё раз.");
          error.retryable = true;
          throw error;
        }
        if (!result?.ok) {
          const error = new Error(result?.error === "agent_not_found" ? "Агент не найден." : "Не удалось загрузить данные.");
          error.code = result?.error || "invalid_response";
          error.retryable = result?.error === "server_error";
          throw error;
        }
        return result;
      } catch (error) {
        const transient = error.retryable === true || error.name === "AbortError" || error instanceof TypeError;
        if (!transient || attempt === 1) {
          if (error.name === "AbortError" || error instanceof TypeError) throw new Error("Сервис отвечает дольше обычного. Попробуйте ещё раз.");
          throw error;
        }
      } finally {
        window.clearTimeout(timer);
      }
    }
    throw new Error("Сервис отвечает дольше обычного. Попробуйте ещё раз.");
  }

  async function publicRequest(action, data = {}) {
    const timeoutMs = action === "get_public_agent_objects"
      ? PUBLIC_AGENT_PROFILE_TIMEOUT_MS
      : action === "list_public_agents"
        ? PUBLIC_AGENT_DIRECTORY_TIMEOUT_MS
        : DEFAULT_API_TIMEOUT_MS;
    if (["get_public_agent_objects", "list_public_agents"].includes(action)) {
      const key = action + ":" + (action === "get_public_agent_objects" ? String(data.agent_ref || "") : "");
      if (!publicReadsInFlight.has(key)) {
        const pending = fetchPublicRead(action, data, timeoutMs).finally(() => publicReadsInFlight.delete(key));
        publicReadsInFlight.set(key, pending);
      }
      return publicReadsInFlight.get(key);
    }
    const response = await apiRequest({ ...data, action }, timeoutMs);
    if (!response?.ok) {
      const error = new Error(response?.message || "Не удалось загрузить данные.");
      error.code = response?.error || "request_failed";
      throw error;
    }
    return response;
  }

  function dispatchRoleChange() {
    const termsAccepted = agentTermsAccepted();
    window.dispatchEvent(new CustomEvent("liberterra:agent-role", {
      detail: {
        role: state.role,
        approved: state.role === "approved",
        hasAgentAccess: state.role === "approved" && Boolean(state.access) && termsAccepted,
        termsAccepted,
        specializationRequired: state.specializationRequired,
      },
    }));
  }

  function setRole(role, accessPayload = null, options = {}) {
    state.role = normalizeRole(role);
    state.checkError = "";
    state.access = state.role === "approved" ? sanitizeAgentAccess(accessPayload) : null;
    state.specializationRequired = state.role === "approved"
      && options.specializationRequired === true
      && !state.access;
    state.checking = false;
    document.documentElement.dataset.agentRole = state.role;
    document.documentElement.dataset.agentAccess = state.access
      ? agentTermsAccepted() ? "granted" : "terms-pending"
      : "hidden";
    document.documentElement.dataset.agentSpecializationRequired = state.specializationRequired ? "true" : "false";
    destroyTermsModal();
    if (!state.specializationRequired) destroySpecializationModal();
    renderAgentControls();
    dispatchRoleChange();
    if (state.specializationRequired && isTelegramSession) {
      window.setTimeout(openSpecializationModal, 0);
    }
  }

  function controlHtml() {
    if (state.checking) {
      return '<span class="agent-status agent-status-loading" role="status">Проверяем статус...</span>';
    }
    if (state.checkError) {
      return `
        <div class="agent-role-check-error" role="alert">
          <span>Не удалось проверить статус агента.</span>
          <button class="agent-terms-button" type="button" data-agent-retry>Проверить ещё раз</button>
        </div>
      `;
    }
    if (state.role === "approved") {
      if (state.specializationRequired) {
        return '<span class="agent-status agent-status-approved"><span aria-hidden="true">✓</span> Агент Liberterra</span>';
      }
      if (state.access && !agentTermsAccepted()) {
        return `
          <section class="agent-next-step-card" aria-labelledby="agentNextStepTitle">
            <div class="agent-next-step-top">
              <span class="agent-status agent-status-approved"><span aria-hidden="true">✓</span> Агент одобрен</span>
            </div>
            <h2 id="agentNextStepTitle">Завершите подключение</h2>
            <p>Откройте условия, ознакомьтесь с ними и подтвердите согласие, чтобы получить рабочий доступ.</p>
            <button class="agent-next-step-button" type="button" data-agent-terms-open>
              Открыть условия и продолжить
              <span class="agent-next-step-arrow" aria-hidden="true">→</span>
            </button>
          </section>
        `;
      }
      return `
        <div class="agent-approved-controls">
          <div class="agent-complete-copy">
            <strong>Рабочий доступ открыт</strong>
            <span>Направление: ${state.access?.specialization === "sale" ? "Продажа" : "Аренда"}</span>
          </div>
          <span class="agent-status agent-status-approved"><span aria-hidden="true">✓</span> Условия приняты</span>
          <div class="agent-approved-actions">
            <button class="agent-terms-button" type="button" data-agent-terms-open>Посмотреть условия</button>
            <a class="agent-catalog-button" href="#catalogGrid" data-agent-catalog-link>Перейти в каталог</a>
            <a class="agent-cabinet-button" href="/agent-cabinet.html">Кабинет агента</a>
          </div>
        </div>
      `;
    }
    if (state.role === "pending") {
      return '<span class="agent-status agent-status-pending">Ваша заявка на рассмотрении</span>';
    }
    if (!isTelegramSession) {
      return `<a class="agent-access-button" href="${BOT_AGENT_LINK}">Стать агентом Liberterra</a>`;
    }
    return '<button class="agent-access-button" type="button" data-agent-open>Стать агентом Liberterra</button>';
  }

  function renderAgentControls() {
    const expanded = state.role === "approved" && Boolean(state.access);
    const hasHeaderAgentSlot = Boolean(document.querySelector(".site-header [data-agent-access-slot]"));
    document.body?.classList.toggle("agent-access-expanded", expanded && hasHeaderAgentSlot);

    document.querySelectorAll("[data-agent-guest-link]").forEach((link) => {
      link.hidden = state.checking || state.role !== "guest";
    });

    document.querySelectorAll("[data-agent-access-slot]").forEach((slot) => {
      slot.classList.toggle("agent-access-slot-expanded", expanded);
      slot.innerHTML = controlHtml();
    });
  }

  function fullNameFromTelegram() {
    return [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(" ").trim();
  }

  function usernameFromTelegram() {
    const username = normalize(telegramUser?.username).replace(/^@+/, "");
    return username ? `@${username}` : "";
  }

  function modalHtml() {
    return `
      <div class="agent-modal" id="agentModal" hidden>
        <button class="agent-modal-backdrop" type="button" data-agent-close aria-label="Закрыть форму"></button>
        <section class="agent-modal-panel" role="dialog" aria-modal="true" aria-labelledby="agentModalTitle">
          <button class="agent-modal-close" type="button" data-agent-close aria-label="Закрыть">×</button>
          <div class="agent-modal-scroll">
            <div data-agent-form-view>
              <header class="agent-modal-heading">
                <span class="agent-modal-kicker">Liberterra для агентов</span>
                <h2 id="agentModalTitle">Стать агентом Liberterra</h2>
                <p>Доступ к комиссиям и работе с объектами открывается после проверки. Обычно активируем в течение дня.</p>
              </header>
              <form class="agent-form" id="agentRegistrationForm" novalidate>
                <div class="agent-form-grid">
                  <label class="agent-field agent-field-wide">
                    <span>Имя и фамилия *</span>
                    <input name="full_name" type="text" autocomplete="name" required maxlength="120" value="${escapeHtml(fullNameFromTelegram())}">
                  </label>
                  <label class="agent-field" data-agent-agency-field>
                    <span>Агентство *</span>
                    <input name="agency" type="text" autocomplete="organization" required maxlength="120" placeholder="Название агентства">
                  </label>
                  <label class="agent-check agent-private-check">
                    <input name="private_agent" type="checkbox">
                    <span>Частный агент</span>
                  </label>
                  <fieldset class="agent-specialization agent-field-wide">
                    <legend>Направление работы *</legend>
                    <div class="agent-specialization-options">
                      <label>
                        <input name="specialization" type="radio" value="rent" required>
                        <span>Аренда</span>
                      </label>
                      <label>
                        <input name="specialization" type="radio" value="sale" required>
                        <span>Продажа</span>
                      </label>
                    </div>
                  </fieldset>
                  <label class="agent-field">
                    <span>Рабочий номер телефона *</span>
                    <input name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="32" placeholder="+996 555 123 456">
                    <small>Укажите действующий номер для звонков и WhatsApp</small>
                  </label>
                  <label class="agent-field">
                    <span>@username Telegram</span>
                    <input name="username" type="text" autocomplete="username" maxlength="64" value="${escapeHtml(usernameFromTelegram())}" placeholder="@username">
                  </label>
                  <label class="agent-field">
                    <span>Опыт в недвижимости, лет</span>
                    <input name="experience" type="number" inputmode="numeric" min="0" max="70" step="1" placeholder="Например, 3">
                  </label>
                  <label class="agent-field">
                    <span>Документ или сертификат</span>
                    <input name="document" type="text" maxlength="500" placeholder="Номер или ссылка на скан">
                  </label>
                  <label class="agent-field agent-field-wide">
                    <span>Фото документа, необязательно</span>
                    <input name="document_photo" type="file" accept="image/jpeg,image/png,image/webp">
                    <small>JPG, PNG или WebP до 3 МБ</small>
                  </label>
                </div>
                <label class="agent-check agent-rules-check">
                  <input name="rules_accepted" type="checkbox" required>
                  <span>Согласен с правилами платформы *</span>
                </label>
                <p class="agent-form-error" data-agent-form-error role="alert" hidden></p>
                <button class="agent-submit" type="submit">Отправить заявку</button>
              </form>
            </div>
            <div class="agent-success" data-agent-success-view hidden>
              <span class="agent-success-mark" aria-hidden="true">✓</span>
              <h2>Заявка отправлена</h2>
              <p>Мы проверим данные и активируем доступ — обычно в течение дня.</p>
              <button class="agent-submit" type="button" data-agent-close>Закрыть</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function ensureModal() {
    if (agentModal) return;
    document.body.insertAdjacentHTML("beforeend", modalHtml());
    agentModal = document.querySelector("#agentModal");
    agentForm = document.querySelector("#agentRegistrationForm");
    agentForm?.querySelector('[name="private_agent"]')?.addEventListener("change", updateAgencyField);
    agentForm?.addEventListener("submit", submitAgentForm);
  }

  function ensureTermsModal() {
    if (termsModal || state.role !== "approved" || !state.access) return;
    document.body.insertAdjacentHTML("beforeend", termsModalHtml());
    termsModal = document.querySelector("#agentTermsModal");
    termsForm = termsModal?.querySelector("#agentTermsConsentForm") || null;
    termsForm?.querySelector("[data-agent-terms-checkbox]")?.addEventListener("change", syncTermsSubmit);
    termsForm?.addEventListener("submit", submitAgentTerms);
  }

  function specializationModalHtml() {
    return `
      <div class="agent-modal" id="agentSpecializationModal" hidden>
        <div class="agent-modal-backdrop" aria-hidden="true"></div>
        <section class="agent-modal-panel agent-specialization-required-panel" role="dialog" aria-modal="true" aria-labelledby="agentSpecializationTitle">
          <div class="agent-modal-scroll">
            <header class="agent-modal-heading agent-direction-heading">
              <h2 id="agentSpecializationTitle">Выберите направление работы</h2>
              <p>После выбора вы увидите условия и комиссии только для своего направления.</p>
            </header>
            <form class="agent-form agent-direction-form" id="agentSpecializationForm" novalidate>
              <div class="agent-direction-options" role="radiogroup" aria-label="Направление работы" aria-describedby="agentDirectionHint agentDirectionError">
                <button class="agent-direction-card" type="button" role="radio" aria-checked="false" data-agent-direction="rent">
                  <span class="agent-direction-icon" aria-hidden="true">🔑</span>
                  <span class="agent-direction-copy">
                    <strong>Аренда</strong>
                    <span>Квартиры и коммерция в аренду</span>
                  </span>
                  <span class="agent-direction-check" aria-hidden="true">✓</span>
                </button>
                <button class="agent-direction-card" type="button" role="radio" aria-checked="false" data-agent-direction="sale">
                  <span class="agent-direction-icon" aria-hidden="true">🏠</span>
                  <span class="agent-direction-copy">
                    <strong>Продажа</strong>
                    <span>Вторичка: квартиры, дома, участки</span>
                  </span>
                  <span class="agent-direction-check" aria-hidden="true">✓</span>
                </button>
              </div>
              <p class="agent-form-error agent-direction-error" id="agentDirectionError" data-agent-specialization-error role="alert" aria-live="polite" hidden></p>
              <p class="agent-direction-hint" id="agentDirectionHint">Направление можно будет сменить позже в профиле.</p>
              <button class="agent-submit agent-direction-submit" type="submit" disabled aria-disabled="true">Сохранить направление</button>
            </form>
          </div>
        </section>
      </div>
    `;
  }

  function ensureSpecializationModal() {
    if (specializationModal) return;
    document.body.insertAdjacentHTML("beforeend", specializationModalHtml());
    specializationModal = document.querySelector("#agentSpecializationModal");
    specializationForm = document.querySelector("#agentSpecializationForm");
    specializationForm?.querySelectorAll("[data-agent-direction]").forEach((card) => {
      card.addEventListener("click", () => selectAgentDirection(card.dataset.agentDirection));
      card.addEventListener("keydown", handleAgentDirectionKeys);
    });
    specializationForm?.addEventListener("submit", submitAgentSpecialization);
  }

  function selectAgentDirection(value, options = {}) {
    if (!specializationForm) return;
    const specialization = normalizeAgentSpecialization(value);
    specializationForm.dataset.specialization = specialization;
    const cards = [...specializationForm.querySelectorAll("[data-agent-direction]")];
    cards.forEach((card) => {
      const selected = card.dataset.agentDirection === specialization;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-checked", selected ? "true" : "false");
      card.tabIndex = selected || !specialization ? 0 : -1;
    });
    const submit = specializationForm.querySelector('[type="submit"]');
    if (submit) {
      submit.disabled = !specialization;
      submit.setAttribute("aria-disabled", specialization ? "false" : "true");
    }
    if (specialization) setSpecializationError("");
    if (options.focus === true) {
      cards.find((card) => card.dataset.agentDirection === specialization)?.focus();
    }
  }

  function handleAgentDirectionKeys(event) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const cards = [...specializationForm.querySelectorAll("[data-agent-direction]")];
    const currentIndex = cards.indexOf(event.currentTarget);
    const step = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const next = cards[(currentIndex + step + cards.length) % cards.length];
    selectAgentDirection(next.dataset.agentDirection, { focus: true });
  }

  function destroyTermsModal() {
    if (!termsModal) return;
    termsModal.remove();
    termsModal = null;
    termsForm = null;
    if ((!agentModal || agentModal.hidden) && (!specializationModal || specializationModal.hidden)) {
      document.body.classList.remove("modal-open");
    }
  }

  function destroySpecializationModal() {
    if (!specializationModal) return;
    specializationModal.remove();
    specializationModal = null;
    specializationForm = null;
    if ((!agentModal || agentModal.hidden) && (!termsModal || termsModal.hidden)) {
      document.body.classList.remove("modal-open");
    }
  }

  function updateAgencyField() {
    if (!agentForm) return;
    const privateAgent = agentForm.elements.private_agent.checked;
    const agency = agentForm.elements.agency;
    agency.disabled = privateAgent;
    agency.required = !privateAgent;
    agency.closest("[data-agent-agency-field]")?.classList.toggle("is-disabled", privateAgent);
  }

  function setFormError(message) {
    const error = agentForm?.querySelector("[data-agent-form-error]");
    if (!error) return;
    error.textContent = normalize(message);
    error.hidden = !normalize(message);
  }

  function openAgentModal() {
    if (!isTelegramSession) {
      window.location.href = BOT_AGENT_LINK;
      return;
    }
    if (!["guest", "rejected"].includes(state.role)) return;
    ensureModal();
    previousFocus = document.activeElement;
    agentModal.hidden = false;
    document.body.classList.add("modal-open");
    setFormError("");
    window.setTimeout(() => agentForm?.elements.full_name?.focus(), 0);
  }

  function closeAgentModal() {
    if (!agentModal || agentModal.hidden) return;
    agentModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }

  function setTermsError(message) {
    const error = termsForm?.querySelector("[data-agent-terms-error]");
    if (!error) return;
    error.textContent = normalize(message);
    error.hidden = !normalize(message);
  }

  function syncTermsSubmit() {
    if (!termsForm) return;
    const checkbox = termsForm.querySelector("[data-agent-terms-checkbox]");
    const submit = termsForm.querySelector('[type="submit"]');
    const checked = checkbox?.checked === true;
    if (submit) {
      submit.disabled = !checked;
      submit.setAttribute("aria-disabled", checked ? "false" : "true");
    }
    if (checked) setTermsError("");
  }

  async function submitAgentTerms(event) {
    event.preventDefault();
    if (!termsForm || !isTelegramSession || state.role !== "approved" || !state.access) return;
    const checkbox = termsForm.querySelector("[data-agent-terms-checkbox]");
    const submit = termsForm.querySelector('[type="submit"]');
    setTermsError("");
    if (!checkbox?.checked) {
      setTermsError("Подтвердите, что вы ознакомились с условиями и согласны с ними.");
      checkbox?.focus();
      return;
    }

    submit.disabled = true;
    submit.setAttribute("aria-disabled", "true");
    submit.textContent = "Сохраняем согласие...";
    try {
      const result = await apiRequest({
        action: "accept_agent_terms",
        telegram_id: Number(telegramUser.id),
        initData,
        accepted: true,
      });
      if (result?.ok !== true || result?.agent_access?.terms?.accepted !== true) {
        throw new Error(result?.error || "terms_not_saved");
      }
      closeTermsModal();
      setRole(result.role || "approved", result.agent_access, { specializationRequired: false });
      window.setTimeout(() => document.querySelector("[data-agent-catalog-link]")?.focus(), 0);
    } catch (_error) {
      setTermsError("Не удалось сохранить согласие. Проверьте соединение и попробуйте ещё раз.");
      submit.disabled = false;
      submit.setAttribute("aria-disabled", "false");
      submit.textContent = "Подтвердить и продолжить";
    }
  }

  function openTermsModal() {
    if (state.role !== "approved" || !state.access) return;
    ensureTermsModal();
    if (!termsModal) return;
    termsPreviousFocus = document.activeElement;
    termsModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => termsModal.querySelector(".agent-modal-close")?.focus(), 0);
  }

  function closeTermsModal() {
    if (!termsModal || termsModal.hidden) return;
    termsModal.hidden = true;
    if (!agentModal || agentModal.hidden) document.body.classList.remove("modal-open");
    if (termsPreviousFocus instanceof HTMLElement) termsPreviousFocus.focus();
  }

  function setSpecializationError(message) {
    const error = specializationForm?.querySelector("[data-agent-specialization-error]");
    if (!error) return;
    error.textContent = normalize(message);
    error.hidden = !normalize(message);
  }

  function openSpecializationModal() {
    if (!isTelegramSession || !state.specializationRequired) return;
    ensureSpecializationModal();
    specializationModal.hidden = false;
    document.body.classList.add("modal-open");
    setSpecializationError("");
    selectAgentDirection("");
    window.setTimeout(() => specializationForm?.querySelector("[data-agent-direction]")?.focus(), 0);
  }

  function fileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(normalize(reader.result).split(",")[1] || ""));
      reader.addEventListener("error", () => reject(new Error("Не удалось прочитать фотографию документа.")));
      reader.readAsDataURL(file);
    });
  }

  async function submitAgentForm(event) {
    event.preventDefault();
    if (!agentForm || !isTelegramSession) return;
    setFormError("");
    updateAgencyField();
    if (!agentForm.reportValidity()) return;

    const workPhone = normalize(agentForm.elements.phone.value);
    if (!isValidWorkPhone(workPhone)) {
      setFormError("Проверьте рабочий номер: введите от 9 до 15 цифр, например +996 555 123 456.");
      agentForm.elements.phone.focus();
      return;
    }

    const submit = agentForm.querySelector('[type="submit"]');
    const photo = agentForm.elements.document_photo.files?.[0] || null;
    if (photo && photo.size > MAX_DOCUMENT_PHOTO_SIZE) {
      setFormError("Фото документа должно быть не больше 3 МБ.");
      return;
    }

    submit.disabled = true;
    submit.textContent = "Отправляем...";
    try {
      const privateAgent = agentForm.elements.private_agent.checked;
      const username = normalize(agentForm.elements.username.value).replace(/^@+/, "");
      const payload = {
        action: "register_agent",
        telegram_id: Number(telegramUser.id),
        initData,
        full_name: normalize(agentForm.elements.full_name.value),
        name: normalize(agentForm.elements.full_name.value),
        agency: privateAgent ? "Частный агент" : normalize(agentForm.elements.agency.value),
        private_agent: privateAgent,
        specialization: normalize(agentForm.elements.specialization.value),
        phone: workPhone,
        username: username ? `@${username}` : "",
        experience: normalize(agentForm.elements.experience.value),
        document: normalize(agentForm.elements.document.value),
        rules_accepted: true,
      };

      if (photo) {
        payload.document_photo_name = photo.name;
        payload.document_photo_type = photo.type;
        payload.document_photo_base64 = await fileAsBase64(photo);
      }

      const result = await apiRequest(payload);
      if (result?.ok !== true) throw new Error(result?.error || "Не удалось отправить заявку.");

      agentModal.querySelector("[data-agent-form-view]").hidden = true;
      agentModal.querySelector("[data-agent-success-view]").hidden = false;
      setRole(result?.role || "pending", result?.agent_access);
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "Сервис не ответил. Попробуйте ещё раз."
        : "Не удалось отправить, попробуйте ещё раз.";
      setFormError(message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Отправить заявку";
    }
  }

  async function submitAgentSpecialization(event) {
    event.preventDefault();
    if (!specializationForm || !isTelegramSession || !state.specializationRequired) return;
    setSpecializationError("");
    const specialization = normalizeAgentSpecialization(specializationForm.dataset.specialization);
    if (!specialization) {
      setSpecializationError("Выберите аренду или продажу.");
      specializationForm.querySelector("[data-agent-direction]")?.focus();
      return;
    }

    const submit = specializationForm.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.setAttribute("aria-disabled", "true");
    submit.textContent = "Сохраняем...";
    try {
      const result = await apiRequest({
        action: "set_agent_specialization",
        telegram_id: Number(telegramUser.id),
        initData,
        specialization,
      });
      if (result?.ok !== true || !result?.agent_access) {
        throw new Error(result?.error || "specialization_not_saved");
      }
      setRole(result.role || "approved", result.agent_access, { specializationRequired: false });
    } catch (_error) {
      setSpecializationError("Не удалось сохранить направление. Попробуйте ещё раз.");
    } finally {
      submit.disabled = false;
      submit.setAttribute("aria-disabled", "false");
      submit.textContent = "Сохранить направление";
    }
  }

  function keepFocusInModal(event) {
    if (event.key !== "Tab") return;
    const activeModal = specializationModal && !specializationModal.hidden
      ? specializationModal
      : termsModal && !termsModal.hidden
        ? termsModal
        : agentModal && !agentModal.hidden
          ? agentModal
          : null;
    if (!activeModal) return;
    const focusable = [...activeModal.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')]
      .filter((element) => !element.hidden && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function checkAgentRole() {
    if (!isTelegramSession) {
      setRole("guest");
      try {
        const response = await fetch("/api/user-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ action: "check_user" }),
        });
        const result = await response.json().catch(() => ({}));
        state.isWebSession = Boolean(response.ok && result?.registered);
        if (state.isWebSession) window.dispatchEvent(new CustomEvent("liberterra:user-registered", { detail: result }));
      } catch (_error) {
        state.isWebSession = false;
      }
      return;
    }

    state.checking = true;
    state.checkError = "";
    renderAgentControls();
    try {
      const result = await apiRequest({
        action: "check_agent",
        telegram_id: Number(telegramUser.id),
        initData,
      });
      setRole(result?.role, result?.agent_access, {
        specializationRequired: result?.specialization_required === true,
      });
    } catch (_error) {
      state.checking = false;
      state.checkError = "agent_status_check_failed";
      renderAgentControls();
      dispatchRoleChange();
      return;
    }

    const shouldOpen = new URLSearchParams(window.location.search).get("open_agent") === "1";
    if (shouldOpen && ["guest", "rejected"].includes(state.role)) openAgentModal();
  }

  function init() {
    ensureAgentStyles();
    telegram?.ready?.();
    telegram?.expand?.();
    document.documentElement.dataset.telegramApp = isTelegramSession ? "true" : "false";
    renderAgentControls();
    ensureModal();
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-agent-open]")) {
        event.preventDefault();
        openAgentModal();
      }
      if (event.target.closest("[data-agent-retry]")) {
        event.preventDefault();
        checkAgentRole();
      }
      if (event.target.closest("[data-agent-close]")) {
        event.preventDefault();
        closeAgentModal();
      }
      if (event.target.closest("[data-agent-terms-open]")) {
        event.preventDefault();
        openTermsModal();
      }
      if (event.target.closest("[data-agent-terms-close]")) {
        event.preventDefault();
        closeTermsModal();
      }
      if (event.target.closest("[data-agent-specialization-open]")) {
        event.preventDefault();
        openSpecializationModal();
      }
      if (event.target.closest("[data-agent-catalog-link]") && termsModal && !termsModal.hidden) {
        closeTermsModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (specializationModal && !specializationModal.hidden) {
          event.preventDefault();
        } else if (termsModal && !termsModal.hidden) closeTermsModal();
        else closeAgentModal();
      }
      keepFocusInModal(event);
    });
    checkAgentRole();
  }

  window.LiberterraAgentAccess = Object.freeze({
    getState: () => ({ ...state }),
    hasUserSession: () => isTelegramSession || state.isWebSession,
    isApproved: () => state.role === "approved",
    hasAgentAccess: () => state.role === "approved" && Boolean(state.access) && agentTermsAccepted(),
    commissionFor: (item) => state.role === "approved" && state.access && agentTermsAccepted() ? calculateCommission(item) : null,
    commissionBadgeHtml,
    hasVerifiedContract,
    contractVerifiedBadgeHtml,
    openTerms: openTermsModal,
    request: authenticatedRequest,
    ensureModerationNotification,
    publicRequest,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
