(() => {
  "use strict";
  const profile = document.querySelector("#profileCard");
  if (!profile) return;
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  let user = null;

  async function accountAction(action, data = {}) {
    const response = await fetch("/api/account-action", {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error(body.error || "request_failed");
    return body;
  }

  const options = {
    client: '<option value="buy">Хочу купить</option><option value="rent">Хочу арендовать</option><option value="browse">Пока смотрю варианты</option>',
    owner: '<option value="sell">Хочу продать</option><option value="lease">Хочу сдать в аренду</option>',
    agent: '<option value="">Работаю с недвижимостью</option>',
  };
  function roleForm(current = "") {
    return `<form class="lt-onboarding-form" data-onboarding-role-form>
      <div class="lt-onboarding-grid"><label>Кто вы на Liberterra?
        <select name="registration_role" required><option value="">Выберите</option><option value="client"${current === "client" ? " selected" : ""}>Ищу недвижимость</option><option value="owner"${current === "owner" ? " selected" : ""}>Я собственник</option><option value="agent"${current === "agent" ? " selected" : ""}>Я агент по недвижимости</option></select></label>
        <label>Что планируете?<select name="registration_purpose" data-onboarding-purpose required></select></label></div>
      <p class="lt-onboarding-note">Выбранная роль помогает настроить кабинет. Доступ агента к CRM появится только после проверки анкеты.</p>
      <p class="lt-onboarding-feedback" role="status" aria-live="polite"></p>
      <button class="lt-onboarding-primary" type="submit">Продолжить</button>
    </form>`;
  }
  function agentForm() {
    return `<form class="lt-onboarding-form" data-onboarding-agent-form>
      <div class="lt-onboarding-grid">
        <label>Имя и фамилия *<input name="full_name" autocomplete="name" required minlength="2" maxlength="120" value="${escape(user.name)}"></label>
        <label>Телефон *<input name="phone" type="tel" autocomplete="tel" required maxlength="40" value="${escape(user.phone)}"></label>
        <label>Формат работы *<select name="agent_format" required><option value="">Выберите</option><option value="agency">Агентство недвижимости</option><option value="private">Частный риелтор</option></select></label>
        <label data-agency-field hidden>Название агентства *<input name="agency" maxlength="120"></label>
        <label>Направление *<select name="specialization" required><option value="">Выберите</option><option value="sale">Продажа</option><option value="rent">Аренда</option></select></label>
        <label>Опыт работы, лет *<input name="experience" type="number" min="0" max="70" step="1" required></label>
        <label>Фото профиля *<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label>
        <label>Номер сертификата, если есть<input name="certificate_number" maxlength="80" placeholder="Можно добавить позже"></label>
        <label>Сертификат, если есть<input name="certificate_file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></label>
      </div>
      <p class="lt-onboarding-note">Фото обязательно. Мы подготовим квадратное изображение без метаданных телефона. Сертификат необязателен.</p>
      <label class="lt-onboarding-check"><input type="checkbox" name="commission_sharing"><span>Готов работать с другими агентами и делиться комиссией по совместным сделкам. Долю вы указываете сами в каждом объявлении.</span></label>
      <label class="lt-onboarding-check"><input type="checkbox" name="rules_accepted" required><span>Согласен с правилами работы агентов Liberterra и обработкой данных заявки.</span></label>
      <p class="lt-onboarding-feedback" role="status" aria-live="polite"></p>
      <button class="lt-onboarding-primary" type="submit">Отправить анкету на проверку</button>
    </form>`;
  }

  function render() {
    profile.querySelector("[data-profile-onboarding]")?.remove();
    if (!user) return;
    const status = user.agent_application_status || "";
    const role = user.registration_role || (status ? "agent" : "");
    if (role === "agent" && status === "approved") return;
    const section = document.createElement("section");
    section.className = "lt-onboarding";
    section.dataset.profileOnboarding = "";
    section.setAttribute("aria-labelledby", "ltOnboardingTitle");
    if (role === "agent" && status) {
      const text = status === "approved" ? "Анкета одобрена. Ваши рабочие инструменты доступны в кабинете агента."
        : status === "pending" ? "Анкета отправлена. После проверки мы обновим статус в кабинете."
        : "Статус анкеты: " + status + ". Для уточнения обратитесь в поддержку.";
      section.innerHTML = `<span class="lt-onboarding-eyebrow">АНКЕТА АГЕНТА</span><h2 id="ltOnboardingTitle">${status === "approved" ? "Вы агент Liberterra" : "Заявка агента"}</h2><p>${escape(text)}</p>${status === "approved" ? '<a class="lt-onboarding-primary" href="/agent-cabinet.html">Открыть кабинет</a>' : '<a href="https://t.me/Liberterra_kg_bot?start=support" target="_blank" rel="noopener">Связаться с поддержкой</a>'}`;
    } else if (role === "agent") {
      section.innerHTML = '<span class="lt-onboarding-eyebrow">ШАГ 2 ИЗ 2</span><h2 id="ltOnboardingTitle">Анкета агента</h2><p>Расскажите о своей работе. После проверки заявки мы откроем доступ к CRM.</p>' + agentForm();
    } else if (!role || !user.registration_purpose) {
      section.innerHTML = '<span class="lt-onboarding-eyebrow">НАСТРОЙКА КАБИНЕТА</span><h2 id="ltOnboardingTitle">Расскажите, чем вам помочь</h2><p>Выберите роль и цель, чтобы видеть подходящие действия в кабинете.</p>' + roleForm(role);
    } else if (role === "owner") {
      section.innerHTML = '<span class="lt-onboarding-eyebrow">КАБИНЕТ СОБСТВЕННИКА</span><h2 id="ltOnboardingTitle">Ваши объекты в одном месте</h2><p>Разместите объект и следите за откликами в личном кабинете.</p><div class="lt-onboarding-actions"><a class="lt-onboarding-primary" href="/add-object.html">Разместить объект</a><button type="button" data-onboarding-change-role>Изменить роль</button></div>';
    } else {
      section.innerHTML = '<span class="lt-onboarding-eyebrow">КАБИНЕТ КЛИЕНТА</span><h2 id="ltOnboardingTitle">Начните поиск</h2><p>Смотрите предложения и сохраняйте понравившиеся объекты.</p><div class="lt-onboarding-actions"><a class="lt-onboarding-primary" href="/">Смотреть объекты</a><button type="button" data-onboarding-change-role>Изменить роль</button></div>';
    }
    profile.prepend(section);
    const roleSelect = section.querySelector('[name="registration_role"]');
    if (roleSelect) updatePurpose(roleSelect);
  }
  function updatePurpose(select) {
    const target = select.form.querySelector('[name="registration_purpose"]');
    target.innerHTML = options[select.value] || '<option value="">Сначала выберите роль</option>';
    target.required = select.value !== "agent";
  }
  function imageToJpeg(file) {
    return new Promise((resolve, reject) => {
      if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) return reject(new Error("Выберите фото JPG, PNG или WebP размером до 8 МБ."));
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 512;
        const side = Math.min(image.width, image.height);
        const x = (image.width - side) / 2, y = (image.height - side) / 2;
        canvas.getContext("2d").drawImage(image, x, y, side, side, 0, 0, 512, 512);
        let base64 = "";
        for (const quality of [0.78, 0.68, 0.58, 0.48]) {
          base64 = canvas.toDataURL("image/jpeg", quality).split(",")[1] || "";
          if (base64.length <= 200000) break;
        }
        if (!base64 || base64.length > 200000) return reject(new Error("Фото слишком подробное. Выберите другое изображение."));
        resolve(base64);
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Не удалось открыть фото.")); };
      image.src = url;
    });
  }
  function certificateImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.size) return resolve(null);
      if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) || file.size > 3 * 1024 * 1024) return reject(new Error("Сертификат должен быть PDF, JPG, PNG или WebP до 3 МБ."));
      const reader = new FileReader();
      reader.onload = () => resolve({ document_photo_type: file.type, document_photo_base64: String(reader.result).split(",")[1] || "" });
      reader.onerror = () => reject(new Error("Не удалось открыть сертификат."));
      reader.readAsDataURL(file);
    });
  }

  window.addEventListener("liberterra:profile-data", (event) => {
    if (window.LiberterraAgentAccess?.getState?.()?.isTelegramSession) return;
    user = event.detail?.user || null;
    render();
  });
  profile.addEventListener("change", (event) => {
    if (event.target.matches('[name="registration_role"]')) updatePurpose(event.target);
    if (event.target.matches('[name="agent_format"]')) {
      const field = event.target.form.querySelector("[data-agency-field]");
      field.hidden = event.target.value !== "agency";
      field.querySelector("input").required = !field.hidden;
    }
  });
  profile.addEventListener("click", (event) => {
    if (!event.target.closest("[data-onboarding-change-role]")) return;
    user.registration_purpose = "";
    render();
    profile.querySelector('[name="registration_role"]')?.focus();
  });
  profile.addEventListener("submit", async (event) => {
    const roleFormNode = event.target.closest("[data-onboarding-role-form]");
    const agentFormNode = event.target.closest("[data-onboarding-agent-form]");
    if (!roleFormNode && !agentFormNode) return;
    event.preventDefault();
    const form = roleFormNode || agentFormNode;
    const button = form.querySelector('[type="submit"]'), feedback = form.querySelector(".lt-onboarding-feedback");
    button.disabled = true; feedback.textContent = "Сохраняем…";
    try {
      const data = new FormData(form);
      if (roleFormNode) {
        const result = await accountAction("save_registration_role", { registration_role: data.get("registration_role"), registration_purpose: data.get("registration_purpose") });
        user.registration_role = result.registration_role;
        user.registration_purpose = result.registration_purpose;
        const label = result.registration_role === "agent" ? "Агент — заявка" : result.registration_role === "owner" ? "Собственник" : "Клиент";
        for (const node of document.querySelectorAll('.pv2-role-badge,.pv2-sidebar-user-role,.profile-identity small')) node.textContent = label;
      } else {
        const photo_base64 = await imageToJpeg(data.get("photo"));
        const certificate = await certificateImage(data.get("certificate_file"));
        const result = await accountAction("submit_web_agent_application", {
          full_name: data.get("full_name"), phone: data.get("phone"),
          private_agent: data.get("agent_format") === "private", agency: data.get("agency"),
          specialization: data.get("specialization"), experience: Number(data.get("experience")),
          certificate_number: data.get("certificate_number"), photo_base64, ...(certificate || {}),
          commission_sharing: data.has("commission_sharing"),
          rules_accepted: data.has("rules_accepted"),
        });
        user.agent_application_status = result.role;
      }
      render();
      const heading = profile.querySelector("[data-profile-onboarding] h2");
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      profile.querySelector("[data-profile-onboarding]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      const messages = { application_exists: "Анкета уже отправлена. Обновите страницу, чтобы увидеть её статус.", agent_role_required: "Сначала выберите роль агента.", invalid_application: "Проверьте имя, телефон, формат работы и опыт.", photo_required: "Для заявки агента необходимо фото.", invalid_photo: "Не удалось обработать фото. Выберите другое изображение.", application_save_failed: "Анкету пока не удалось сохранить. Попробуйте ещё раз." };
      feedback.textContent = messages[error.message] || error.message || "Не удалось сохранить. Повторите попытку.";
      button.disabled = false;
    }
  });
})();
