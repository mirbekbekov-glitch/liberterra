(() => {
  "use strict";
  const API_URL = "/api/user-access";
  const telegram = window.Telegram?.WebApp || null;
  const telegramUser = telegram?.initDataUnsafe?.user || null;
  const initData = typeof telegram?.initData === "string" ? telegram.initData.trim() : "";
  let registered = false;
  let checking = null;
  let currentUser = null;
  const entryMode = document.body?.dataset.registrationEntry === "true";
  const verifiedUserKey = telegramUser?.id ? `liberterra-verified-user:${telegramUser.id}` : "liberterra-verified-web-user";
  const safeNextUrl = () => {
    const next = new URLSearchParams(window.location.search).get("next") || "";
    return next.startsWith("/") && !next.startsWith("//") ? next : "";
  };

  const finishWebLogin = (user) => {
    registered = true;
    currentUser = user || null;
    rememberVerifiedUser(currentUser);
    const next = safeNextUrl();
    if (next) {
      window.location.assign(next);
      return;
    }
    if (entryMode) showWelcome(currentUser); else hideRegistration();
  };

  const rememberVerifiedUser = (user) => {
    try {
      if (verifiedUserKey) {
        const value = JSON.stringify({ user: user || null, verified_at: Date.now() });
        window.localStorage.setItem(verifiedUserKey, value);
        window.sessionStorage.setItem(verifiedUserKey, value);
      }
    } catch (_) {}
  };

  const restoreVerifiedUser = () => {
    try {
      if (!verifiedUserKey) return null;
      const raw = window.localStorage.getItem(verifiedUserKey) || window.sessionStorage.getItem(verifiedUserKey) || "null";
      const cached = JSON.parse(raw);
      if (!cached || !cached.verified_at || Date.now() - Number(cached.verified_at) > 24 * 60 * 60 * 1000) return null;
      return cached.user || {};
    } catch (_) { return null; }
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const fullName = () => [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(" ").trim();
  const guestButtonHtml = () => entryMode
    ? '<button class="registration-guest" type="button" data-registration-guest>Смотреть каталог без регистрации</button>'
    : '';

  async function request(action, data = {}) {
    const emailAction = ["email_auth_start", "email_auth_verify", "password_register_start", "password_register_verify", "password_login", "password_set_start", "password_set_verify", "password_claim_start", "password_claim_verify", "telegram_password_link_start", "telegram_password_link_verify"].includes(action);
    if (!emailAction && action !== "check_user" && (!initData || !telegramUser?.id)) {
      const error = new Error("Откройте платформу внутри Telegram.");
      error.code = "telegram_required";
      throw error;
    }
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ ...data, action, ...(telegramUser?.id ? { telegram_id: Number(telegramUser.id), init_data: initData } : {}) }),
        signal: controller.signal,
      });
    } catch (cause) {
      const error = new Error(cause?.name === "AbortError" ? "Сервис входа не ответил вовремя." : "Не удалось проверить аккаунт.");
      error.code = cause?.name === "AbortError" ? "request_timeout" : "request_failed";
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      const error = new Error(result.message || result.error || "request_failed");
      error.code = result.error || "request_failed";
      throw error;
    }
    return result;
  }

  function passwordFieldHtml(label, name, autocomplete, placeholder = "") {
    return `<label><span>${escapeHtml(label)} *</span><span class="registration-password-field"><input name="${escapeHtml(name)}" type="password" required minlength="12" maxlength="128" autocomplete="${escapeHtml(autocomplete)}"${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ""}><button class="registration-password-toggle" type="button" data-password-toggle aria-label="Показать пароль" aria-pressed="false"><span aria-hidden="true">👁</span></button></span></label>`;
  }

  function emailFormHtml(message = "Войдите по email и паролю. Если аккаунта ещё нет — создайте его один раз.", mode = "login", emailValue = "") {
    const registration = mode === "register";
    const setPassword = mode === "set-password";
    const claim = mode === "claim";
    return `
      <div class="registration-tabs" role="tablist"><button class="${mode === "login" ? "is-active" : ""}" type="button" data-email-tab="login">Войти</button><button class="${registration ? "is-active" : ""}" type="button" data-email-tab="register">Зарегистрироваться</button></div>
      <img class="registration-logo" src="/assets/liberterra-logo-white.png" alt="Liberterra">
      <h2 id="registrationTitle">${registration ? "Создать аккаунт" : setPassword ? "Задать пароль" : claim ? "Перенести профиль агента на сайт" : "Войти в Liberterra"}</h2>
      <p>${escapeHtml(claim ? "Введите телефон из вашей анкеты агента, новый email и пароль. Telegram открывать не нужно." : message)}</p>
      <form data-email-auth-form data-email-mode="${mode}">
        ${registration ? '<label><span>Имя и фамилия *</span><input name="full_name" required maxlength="120" autocomplete="name"></label>' : ""}
        ${registration || claim ? '<label><span>Телефон *</span><input name="phone" required maxlength="40" autocomplete="tel" inputmode="tel" placeholder="+996 555 000 000"></label>' : ""}
        <label><span>Email *</span><input name="email" required maxlength="160" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${escapeHtml(emailValue)}"></label>
        ${passwordFieldHtml("Пароль", "password", registration || setPassword || claim ? "new-password" : "current-password", "Минимум 12 символов")}
        ${registration || setPassword || claim ? passwordFieldHtml("Повторите пароль", "password_confirm", "new-password") : ""}
        ${registration ? '<label class="consent-row"><input type="checkbox" required><span>Согласен с правилами платформы и обработкой данных.</span></label>' : ""}
        <p class="registration-error" data-registration-error role="alert" hidden></p>
        <button class="registration-primary" type="submit">${registration ? "Создать аккаунт" : setPassword || claim ? "Отправить код" : "Войти"}</button>
      </form>${!registration && !setPassword && !claim ? '<button class="registration-guest" type="button" data-password-set>Забыли пароль? Установить новый</button><button class="registration-guest" type="button" data-account-claim>Агент уже зарегистрирован через Telegram? Перенести профиль на сайт</button>' : ''}${guestButtonHtml()}`;
  }

  function claimPendingHtml() {
    return `<img class="registration-logo" src="/assets/liberterra-logo-white.png" alt="Liberterra">
      <h2 id="registrationTitle">Заявка отправлена</h2>
      <p>Мы нашли существующий профиль. После одобрения администратором войдите по указанным email и паролю. Telegram для входа больше не потребуется.</p>
      <button class="registration-primary" type="button" data-email-tab="login">Перейти ко входу</button>`;
  }

  function emailCodeFormHtml(email, flow) {
    return `
      <img class="registration-logo" src="/assets/liberterra-logo-white.png" alt="Liberterra">
      <h2 id="registrationTitle">Введите код</h2>
      <p>Мы отправили шестизначный код на <strong>${escapeHtml(email)}</strong>. Он действует 10 минут.</p>
      <form data-email-code-form data-email="${escapeHtml(email)}" data-email-flow="${escapeHtml(flow)}">
        <label><span>Код из письма *</span><input name="code" required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456"></label>
        <p class="registration-error" data-registration-error role="alert" hidden></p>
        <button class="registration-primary" type="submit">Подтвердить</button>
      </form>
      <button class="registration-guest" type="button" data-email-restart>Указать другой email</button>`;
  }

  function telegramPasswordLinkHtml(message = "Привяжите email и пароль к этому Telegram-аккаунту. После подтверждения вы сможете входить на сайт без Telegram.") {
    return `
      <img class="registration-logo" src="/assets/liberterra-logo-white.png" alt="Liberterra">
      <h2 id="registrationTitle">Вход на сайт без Telegram</h2>
      <p>${escapeHtml(message)}</p>
      <form data-email-auth-form data-email-mode="telegram-link">
        <label><span>Email *</span><input name="email" required maxlength="160" autocomplete="email" inputmode="email" placeholder="you@example.com"></label>
        ${passwordFieldHtml("Пароль", "password", "new-password", "Минимум 12 символов")}
        ${passwordFieldHtml("Повторите пароль", "password_confirm", "new-password")}
        <p class="registration-error" data-registration-error role="alert" hidden></p>
        <button class="registration-primary" type="submit">Отправить код</button>
      </form>`;
  }

  function registrationFormHtml(message = "Так объявления будут закреплены за вами, и только вы сможете их редактировать.") {
    return `
      <div class="registration-tabs" role="tablist"><button type="button" data-registration-tab="login">Вход</button><button class="is-active" type="button" data-registration-tab="register">Регистрация</button></div>
      <img class="registration-logo" src="/assets/liberterra-logo-white.png" alt="Liberterra">
      <h2 id="registrationTitle">Создать аккаунт</h2>
      <p>${escapeHtml(message)}</p>
      <form data-user-registration-form>
        <label><span>Имя и фамилия *</span><input name="full_name" required maxlength="120" autocomplete="name" value="${escapeHtml(fullName())}"></label>
        <label><span>Телефон *</span><input name="phone" required maxlength="40" autocomplete="tel" inputmode="tel" placeholder="+996 555 000 000"></label>
        <label><span>Кто вы? *</span><select name="account_type" required><option value="Пользователь">Клиент</option><option value="Агент">Агент по недвижимости</option></select></label>
        <label class="consent-row"><input type="checkbox" required><span>Согласен с правилами платформы и обработкой данных для работы с объявлениями.</span></label>
        <p class="registration-error" data-registration-error role="alert" hidden></p>
        <button class="registration-primary" type="submit">Зарегистрироваться</button>
      </form>
      ${guestButtonHtml()}`;
  }

  function welcomeHtml(user) {
    const name = user?.name || fullName() || "Пользователь";
    const initial = name.slice(0, 1).toUpperCase();
    return `
      <img class="registration-logo" src="/assets/liberterra-logo-white.png" alt="Liberterra">
      <div class="registration-avatar">${escapeHtml(initial)}</div>
      <p class="registration-welcome">С возвращением</p>
      <h2 id="registrationTitle">${escapeHtml(name)}</h2>
      <p>Ваш Telegram-профиль уже найден. Повторно регистрироваться не нужно.</p>
      <button class="registration-primary" type="button" data-registration-continue>Открыть мой профиль</button>
      <p class="registration-legal">Продолжая, вы принимаете условия использования и политику конфиденциальности.</p>`;
  }

  function accessErrorHtml(message = "Не удалось проверить аккаунт. Проверьте интернет и попробуйте ещё раз.") {
    return `
      <img class="registration-logo" src="/assets/liberterra-logo-white.png" alt="Liberterra">
      <h2 id="registrationTitle">Вход в Liberterra</h2>
      <p>${escapeHtml(message)}</p>
      <button class="registration-primary" type="button" data-registration-retry>Повторить проверку</button>
      ${guestButtonHtml()}`;
  }

  function overlayHtml() {
    if (!initData || !telegramUser?.id) return `<section class="registration-card registration-entry-card" role="dialog" aria-modal="true" aria-labelledby="registrationTitle">${emailFormHtml()}</section>`;
    return `<section class="registration-card registration-entry-card" role="dialog" aria-modal="true" aria-labelledby="registrationTitle">${registrationFormHtml()}</section>`;
  }

  function showRegistration() {
    document.body.classList.add("registration-locked");
    let overlay = document.querySelector("#userRegistrationGate");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "userRegistrationGate";
      overlay.className = "registration-gate";
      document.body.append(overlay);
    }
    overlay.innerHTML = overlayHtml();
  }

  function openLogin() {
    showRegistration();
    const card = document.querySelector("#userRegistrationGate .registration-card");
    if (card) card.innerHTML = emailFormHtml(undefined, "login");
    return true;
  }

  function hideRegistration() {
    document.querySelector("#userRegistrationGate")?.remove();
    document.body.classList.remove("registration-locked");
  }

  function showWelcome(user) {
    document.body.classList.add("registration-locked");
    let overlay = document.querySelector("#userRegistrationGate");
    if (!overlay) {
      overlay = document.createElement("div"); overlay.id = "userRegistrationGate"; overlay.className = "registration-gate"; document.body.append(overlay);
    }
    overlay.innerHTML = `<section class="registration-card registration-entry-card" role="dialog" aria-modal="true" aria-labelledby="registrationTitle">${welcomeHtml(user)}</section>`;
  }

  function showAgentNextStep(user) {
    showWelcome(user);
    const card = document.querySelector("#userRegistrationGate .registration-card");
    card.innerHTML = `<h2 id="registrationTitle">Аккаунт создан</h2>
      <p>Вы выбрали роль агента. Следующий шаг — заполнить анкету и принять правила работы агента.</p>
      <p>В публичном списке ваш профиль появится после одобрения администратором. Если анкета уже отправлена, её статус будет виден в профиле.</p>
      <a class="registration-primary registration-link" href="/profile.html?open_agent=1">Перейти к анкете агента</a>
      <button class="registration-guest" type="button" data-registration-continue>Заполнить позже</button>`;
  }

  async function check() {
    if (registered) return true;
    if (checking) return checking;
    checking = request("check_user").then((result) => {
      registered = true; currentUser = result.user || null;
      rememberVerifiedUser(currentUser);
      if (entryMode) showWelcome(currentUser); else hideRegistration();
      window.dispatchEvent(new CustomEvent("liberterra:user-registered"));
      return true;
    }).catch((error) => {
      if (["registration_required", "telegram_required"].includes(error.code)) {
        showRegistration();
      } else {
        showRegistration();
        const card = document.querySelector("#userRegistrationGate .registration-card");
        if (card) card.innerHTML = accessErrorHtml(error.message);
      }
      return false;
    }).finally(() => { checking = null; });
    return checking;
  }

  document.addEventListener("submit", async (event) => {
    const emailForm = event.target.closest("[data-email-auth-form]");
    if (emailForm) {
      event.preventDefault();
      const button = emailForm.querySelector('[type="submit"]');
      const errorBox = emailForm.querySelector("[data-registration-error]");
      const data = new FormData(emailForm);
      button.disabled = true; errorBox.hidden = true;
      try {
        const email = String(data.get("email") || "").trim().toLowerCase();
        const mode = emailForm.dataset.emailMode;
        const password = String(data.get("password") || "");
        if (password.length < 12) throw Object.assign(new Error("weak_password"), { code: "weak_password" });
        if (["register", "set-password", "claim", "telegram-link"].includes(mode) && password !== String(data.get("password_confirm") || "")) throw Object.assign(new Error("password_mismatch"), { code: "password_mismatch" });
        if (mode === "login") {
          const result = await request("password_login", { email, password });
          finishWebLogin(result.user);
          window.dispatchEvent(new CustomEvent("liberterra:user-registered"));
          return;
        }
        const action = mode === "register" ? "password_register_start" : mode === "telegram-link" ? "telegram_password_link_start" : mode === "claim" ? "password_claim_start" : "password_set_start";
        await request(action, { email, password, full_name: data.get("full_name"), phone: data.get("phone") });
        emailForm.closest(".registration-card").innerHTML = emailCodeFormHtml(email, mode);
      } catch (error) {
        if (["telegram-link", "claim"].includes(emailForm.dataset.emailMode) && error.code === "email_in_use") {
          emailForm.closest(".registration-card").innerHTML = emailFormHtml("Этот email уже привязан к аккаунту Liberterra. Введите пароль, чтобы войти.", "login", String(data.get("email") || "").trim().toLowerCase());
          return;
        }
        errorBox.textContent = error.code === "account_exists" ? "Такой аккаунт уже есть. Войдите по email и паролю." : error.code === "email_in_use" ? "Этот email уже привязан к другому аккаунту." : error.code === "agent_not_found" ? "Одобренный профиль с таким телефоном не найден. Проверьте номер или обратитесь к администратору." : error.code === "invalid_credentials" ? "Неверный email или пароль." : error.code === "password_mismatch" ? "Пароли не совпадают." : error.code === "weak_password" ? "Пароль должен содержать минимум 12 символов." : error.code === "retry_later" ? "Попробуйте снова через несколько минут." : "Не удалось выполнить действие. Проверьте данные и попробуйте ещё раз.";
        errorBox.hidden = false;
      } finally { button.disabled = false; }
      return;
    }
    const codeForm = event.target.closest("[data-email-code-form]");
    if (codeForm) {
      event.preventDefault();
      const button = codeForm.querySelector('[type="submit"]');
      const errorBox = codeForm.querySelector("[data-registration-error]");
      button.disabled = true; errorBox.hidden = true;
      try {
        const action = codeForm.dataset.emailFlow === "register" ? "password_register_verify" : codeForm.dataset.emailFlow === "telegram-link" ? "telegram_password_link_verify" : codeForm.dataset.emailFlow === "claim" ? "password_claim_verify" : "password_set_verify";
        const result = await request(action, { email: codeForm.dataset.email, code: new FormData(codeForm).get("code") });
        if (result.pending_approval) {
          codeForm.closest(".registration-card").innerHTML = claimPendingHtml();
          return;
        }
        finishWebLogin(result.user);
        window.dispatchEvent(new CustomEvent("liberterra:user-registered"));
      } catch (error) {
        errorBox.textContent = error.code === "code_expired" ? "Срок кода истёк. Запросите новый." : "Неверный код. Проверьте письмо и попробуйте ещё раз.";
        errorBox.hidden = false;
      } finally { button.disabled = false; }
      return;
    }
    const form = event.target.closest("[data-user-registration-form]");
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const errorBox = form.querySelector("[data-registration-error]");
    button.disabled = true; errorBox.hidden = true;
    try {
      const data = new FormData(form);
      await request("register_user", { full_name: data.get("full_name"), phone: data.get("phone"), account_type: data.get("account_type") });
      registered = true; currentUser = { name: String(data.get("full_name") || "").trim(), account_type: data.get("account_type") };
      rememberVerifiedUser(currentUser);
      if (currentUser.account_type === "Агент") showAgentNextStep(currentUser);
      else if (entryMode) showWelcome(currentUser); else hideRegistration();
      if (window.LiberterraAnalytics) {
        window.LiberterraAnalytics.trackEvent("registration", {
          action_name: "register_user",
          button_label: "Регистрация завершена",
        });
      }
      window.dispatchEvent(new CustomEvent("liberterra:user-registered"));
    } catch (error) {
      errorBox.textContent = error.code === "invalid_phone" ? "Проверьте номер телефона." : "Не удалось зарегистрироваться. Попробуйте ещё раз.";
      errorBox.hidden = false;
    } finally { button.disabled = false; }
  });

  document.addEventListener("click", async (event) => {
    const passwordToggle = event.target.closest("[data-password-toggle]");
    if (passwordToggle) {
      const input = passwordToggle.closest(".registration-password-field")?.querySelector("input");
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      passwordToggle.setAttribute("aria-pressed", String(show));
      passwordToggle.setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
      return;
    }
    if (event.target.closest("[data-registration-continue]")) { hideRegistration(); return; }
    if (event.target.closest("[data-registration-guest]")) {
      hideRegistration();
      window.LiberterraAnalytics?.trackEvent("guest_catalog", {
        action_name: "open_public_catalog",
        button_label: "Смотреть каталог без регистрации",
      });
      return;
    }
    if (event.target.closest("[data-registration-retry]")) { await check(); return; }
    if (event.target.closest("[data-email-restart]")) {
      const flow = event.target.closest(".registration-card")?.querySelector("[data-email-code-form]")?.dataset.emailFlow;
      event.target.closest(".registration-card").innerHTML = flow === "telegram-link"
        ? telegramPasswordLinkHtml("Укажите email и пароль ещё раз, чтобы отправить новый код.")
        : emailFormHtml("Укажите данные ещё раз, чтобы отправить новый код.", flow === "claim" ? "claim" : flow === "set-password" ? "set-password" : "register");
      return;
    }
    if (event.target.closest("[data-password-set]")) {
      const email = String(event.target.closest(".registration-card")?.querySelector('[name="email"]')?.value || "").trim().toLowerCase();
      event.target.closest(".registration-card").innerHTML = emailFormHtml("Введите новый пароль. Подтвердим действие шестизначным кодом из email или Telegram.", "set-password", email);
      return;
    }
    if (event.target.closest("[data-account-claim]")) {
      event.target.closest(".registration-card").innerHTML = emailFormHtml("Укажите телефон существующего профиля, новый email и пароль. После подтверждения email заявка появится у администратора.", "claim");
      return;
    }
    const emailTab = event.target.closest("[data-email-tab]");
    if (emailTab) {
      event.target.closest(".registration-card").innerHTML = emailFormHtml(undefined, emailTab.dataset.emailTab === "register" ? "register" : "login");
      return;
    }
    const tab = event.target.closest("[data-registration-tab]");
    if (!tab) return;
    if (tab.dataset.registrationTab === "register") {
      const card = tab.closest(".registration-card");
      card.innerHTML = registrationFormHtml(registered ? "Аккаунт уже зарегистрирован. При необходимости обновите имя и телефон." : undefined);
      return;
    }
    if (registered) { showWelcome(currentUser); return; }
    const card = tab.closest(".registration-card");
    card.innerHTML = registrationFormHtml("Аккаунт для этого Telegram ещё не найден. Завершите регистрацию.");
  });

  window.LiberterraUserAccess = Object.freeze({
    check, isRegistered: () => registered, require: async () => (await check()) || Promise.reject(new Error("registration_required")),
    openLogin,
    linkTelegramAccount: () => {
      if (!initData || !telegramUser?.id) return false;
      document.body.classList.add("registration-locked");
      let overlay = document.querySelector("#userRegistrationGate");
      if (!overlay) { overlay = document.createElement("div"); overlay.id = "userRegistrationGate"; overlay.className = "registration-gate"; document.body.append(overlay); }
      overlay.innerHTML = `<section class="registration-card registration-entry-card" role="dialog" aria-modal="true" aria-labelledby="registrationTitle">${telegramPasswordLinkHtml()}</section>`;
      return true;
    },
  });
  const cachedUser = restoreVerifiedUser();
  if (cachedUser) {
    registered = true;
    currentUser = cachedUser;
    if (entryMode) showWelcome(currentUser); else hideRegistration();
    window.setTimeout(() => {
      request("check_user").then((result) => {
        currentUser = result.user || currentUser;
        rememberVerifiedUser(currentUser);
        window.dispatchEvent(new CustomEvent("liberterra:user-registered"));
      }).catch(() => {});
    }, 250);
  }
  const shouldCheckOnOpen = () => document.body?.dataset.requireRegistration === "true" || document.body?.dataset.registrationEntry === "true";
  if (shouldCheckOnOpen()) check();
  else document.addEventListener("DOMContentLoaded", () => { if (shouldCheckOnOpen()) check(); }, { once: true });
})();
