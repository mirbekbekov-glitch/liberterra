const submissionForm = document.querySelector("#objectSubmissionForm");
let submissionAttemptId = crypto.randomUUID();
const submissionPhotos = document.querySelector("#submissionPhotos");
const submissionPhotoPreview = document.querySelector("#submissionPhotoPreview");
const submissionPhotoLabel = document.querySelector("#submissionPhotoLabel");
const submissionResult = document.querySelector("#submissionResult");
const submissionPosterType = document.querySelector("#submissionPosterType");
const submissionContractField = document.querySelector("#submissionContractField");
const submissionContractStatus = document.querySelector("#submissionContractStatus");
const submissionDescription = document.querySelector("#submissionDescription");
const submissionDescriptionCount = document.querySelector("#submissionDescriptionCount");
const submissionSourceUrl = document.querySelector("#submissionSourceUrl");
const submissionImportRaw = document.querySelector("#submissionImportRaw");
const lalafoImportUrl = document.querySelector("#lalafoImportUrl");
const lalafoImportButton = document.querySelector("#lalafoImportButton");
const lalafoImportStatus = document.querySelector("#lalafoImportStatus");
const adminAttributionField = document.querySelector("#adminAttributionField");
const adminListingAgent = document.querySelector("#adminListingAgent");
let chosenPhotos = [];
let importedPhotos = [];

function updateDescriptionCount() {
  if (submissionDescriptionCount) {
    submissionDescriptionCount.textContent = `${submissionDescription?.value.length || 0} / 700`;
  }
}

submissionDescription?.addEventListener("input", updateDescriptionCount);
updateDescriptionCount();

const locationMapElement = document.querySelector("#submissionLocationMap");
const latitudeInput = document.querySelector("#submissionLatitude");
const longitudeInput = document.querySelector("#submissionLongitude");
const locationStatus = document.querySelector("#submissionLocationStatus");
const clearLocationButton = document.querySelector("#clearSubmissionLocation");
let locationMarker = null;
let locationMap = null;

if (locationMapElement && window.L) {
  locationMap = L.map(locationMapElement).setView([42.8746, 74.5698], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(locationMap);
  locationMap.on("click", ({ latlng }) => {
    latitudeInput.value = latlng.lat.toFixed(6);
    longitudeInput.value = latlng.lng.toFixed(6);
    locationMarker = locationMarker || L.marker(latlng).addTo(locationMap);
    locationMarker.setLatLng(latlng);
    locationStatus.textContent = `Точка выбрана: ${latitudeInput.value}, ${longitudeInput.value}`;
    clearLocationButton.hidden = false;
  });
}

clearLocationButton?.addEventListener("click", () => {
  latitudeInput.value = "";
  longitudeInput.value = "";
  if (locationMarker && locationMap) locationMap.removeLayer(locationMarker);
  locationMarker = null;
  locationStatus.textContent = "Точка пока не выбрана";
  clearLocationButton.hidden = true;
});

function updateContractQuestion() {
  const isAgent = submissionPosterType.value === "Агент";
  submissionContractField.hidden = !isAgent;
  submissionContractStatus.required = false;
  submissionContractStatus.value = isAgent ? (submissionContractStatus.value || "Нет") : "";
}

submissionPosterType.addEventListener("change", updateContractQuestion);
updateContractQuestion();

async function loadAdminAgentOptions() {
  const telegram = window.Telegram?.WebApp;
  if (!telegram?.initData || !adminAttributionField || !adminListingAgent) return;
  try {
    const response = await fetch("https://hidden-pine-cbff.mirbekbekov.workers.dev/api/admin/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ telegram_init_data: telegram.initData }),
    });
    if (response.status === 403) return;
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || !Array.isArray(result.agents)) return;
    const options = result.agents.map((agent) => {
      const option = document.createElement("option");
      option.value = String(agent.id || "");
      option.textContent = `${agent.name || "Агент Liberterra"}${agent.username ? ` (@${agent.username})` : ""}`;
      return option;
    }).filter((option) => option.value);
    adminListingAgent.append(...options);
    adminAttributionField.hidden = false;
  } catch (_) {
    // The regular submission flow must keep working if the agent directory is temporarily unavailable.
  }
}

adminListingAgent?.addEventListener("change", () => {
  if (!adminListingAgent.value) return;
  submissionPosterType.value = "Агент";
  updateContractQuestion();
});

loadAdminAgentOptions();


const districtList = document.querySelector("#submissionDistricts");
if (districtList && Array.isArray(window.LIBERTERRA_DISTRICTS)) {
  districtList.replaceChildren(...window.LIBERTERRA_DISTRICTS.map((district) => {
    const option = document.createElement("option");
    option.value = district;
    return option;
  }));
}

function selectedPhotos() { return chosenPhotos; }
function totalPhotoCount() { return chosenPhotos.length + importedPhotos.length; }

function syncPhotoInput() {
  const transfer = new DataTransfer();
  chosenPhotos.forEach((file) => transfer.items.add(file));
  submissionPhotos.files = transfer.files;
}

function renderPhotos() {
  const files = selectedPhotos();
  submissionPhotoPreview.replaceChildren();
  const total = totalPhotoCount();
  submissionPhotoLabel.textContent = total ? `${total} из 5 выбрано` : "Файлы не выбраны";
  if (total > 5) {
    submissionResult.textContent = "Можно загрузить не больше 5 фотографий.";
    submissionResult.hidden = false;
    return;
  }
  submissionResult.hidden = true;
  files.forEach((file, index) => {
    const item = document.createElement("div");
    const image = document.createElement("img");
    const remove = document.createElement("button");
    image.alt = file.name;
    image.src = URL.createObjectURL(file);
    image.onload = () => URL.revokeObjectURL(image.src);
    remove.type = "button";
    remove.className = "photo-remove";
    remove.setAttribute("aria-label", `Удалить фотографию ${file.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      chosenPhotos.splice(index, 1);
      syncPhotoInput();
      renderPhotos();
    });
    item.append(image, remove);
    submissionPhotoPreview.append(item);
  });
  importedPhotos.forEach((photo, index) => {
    const item = document.createElement("div");
    const image = document.createElement("img");
    const remove = document.createElement("button");
    item.className = "is-imported";
    image.alt = `Фотография Lalafo ${index + 1}`;
    image.src = photo;
    image.referrerPolicy = "no-referrer";
    remove.type = "button";
    remove.className = "photo-remove";
    remove.setAttribute("aria-label", `Удалить фотографию Lalafo ${index + 1}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      importedPhotos.splice(index, 1);
      renderPhotos();
    });
    item.append(image, remove);
    submissionPhotoPreview.append(item);
  });
}

submissionPhotos.addEventListener("change", () => {
  chosenPhotos = Array.from(submissionPhotos.files || []);
  const available = Math.max(0, 5 - importedPhotos.length);
  if (chosenPhotos.length > available) {
    chosenPhotos = chosenPhotos.slice(0, available);
    syncPhotoInput();
    submissionResult.textContent = "Всего можно оставить не больше 5 фотографий.";
    submissionResult.hidden = false;
  }
  renderPhotos();
});

function setImportStatus(message, type = "") {
  if (!lalafoImportStatus) return;
  lalafoImportStatus.textContent = message;
  lalafoImportStatus.classList.toggle("is-success", type === "success");
  lalafoImportStatus.classList.toggle("is-error", type === "error");
}

function setFormValue(name, value) {
  const field = submissionForm.elements.namedItem(name);
  if (!field || value === undefined || value === null || String(value).trim() === "") return;
  const normalized = String(value).trim();
  if (field instanceof HTMLSelectElement && !Array.from(field.options).some((option) => option.value === normalized)) return;
  field.value = normalized;
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

lalafoImportButton?.addEventListener("click", async () => {
  const sourceUrl = String(lalafoImportUrl?.value || "").trim();
  if (!sourceUrl) {
    setImportStatus("Вставьте ссылку на объявление Lalafo или House.kg.", "error");
    lalafoImportUrl?.focus();
    return;
  }
  try {
    await window.LiberterraUserAccess?.require();
  } catch (_) {
    return;
  }
  lalafoImportButton.disabled = true;
  lalafoImportButton.textContent = "Загружаем…";
  setImportStatus("Читаем объявление…");
  try {
    const telegram = window.Telegram?.WebApp;
    const response = await fetch("/api/import/listing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ url: sourceUrl, telegram_init_data: telegram?.initData || "" }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "import_failed");
    const draft = result.draft || {};
    if (submissionImportRaw) submissionImportRaw.value = JSON.stringify(draft).slice(0, 4000);
    ["deal", "object_type", "district", "address", "rooms", "area", "floor", "total_floors", "price", "price_currency", "description", "latitude", "longitude"]
      .forEach((name) => setFormValue(name, draft[name]));
    const importedLatitude = Number(draft.latitude);
    const importedLongitude = Number(draft.longitude);
    if (locationMap && Number.isFinite(importedLatitude) && Number.isFinite(importedLongitude)) {
      const importedPoint = [importedLatitude, importedLongitude];
      locationMap.setView(importedPoint, 15);
      locationMarker = locationMarker || L.marker(importedPoint).addTo(locationMap);
      locationMarker.setLatLng(importedPoint);
      locationStatus.textContent = `Точка перенесена: ${draft.latitude}, ${draft.longitude}`;
      clearLocationButton.hidden = false;
    }
    submissionSourceUrl.value = result.source_url || sourceUrl;
    importedPhotos = Array.isArray(draft.photos) ? draft.photos.slice(0, 5) : [];
    chosenPhotos = chosenPhotos.slice(0, Math.max(0, 5 - importedPhotos.length));
    syncPhotoInput();
    updateDescriptionCount();
    renderPhotos();
    setImportStatus(`Черновик заполнен. Перенесено фотографий: ${importedPhotos.length}. Проверьте адрес, параметры и контакты.`, "success");
    submissionForm.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const messages = {
      invalid_listing_url: "Нужна ссылка на отдельное объявление Lalafo или House.kg.",
      listing_unavailable: "Сайт объявлений сейчас не отдал данные. Попробуйте позже или заполните форму вручную.",
      listing_not_found: "Не удалось распознать объявление. Проверьте, что ссылка открывается и объявление активно.",
      registration_required: "Для импорта нужно войти в Liberterra.",
    };
    setImportStatus(messages[error.message] || "Не удалось импортировать ссылку. Форму можно заполнить вручную.", "error");
  } finally {
    lalafoImportButton.disabled = false;
    lalafoImportButton.textContent = "Заполнить форму";
  }
});

submissionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try { await window.LiberterraUserAccess?.require(); } catch (_) { return; }
  if (!submissionForm.reportValidity()) return;
  const deal = String(submissionForm.elements.deal.value || "").trim();
  const parsedPrice = window.LiberterraListingFormat.priceParts(
    submissionForm.elements.price.value,
    submissionForm.elements.price_currency.value,
    submissionForm.elements.price_basis.value,
    deal === "Аренда" ? "month" : "none",
  );
  if (!parsedPrice) {
    submissionResult.textContent = "Проверьте цену, валюту и способ расчёта.";
    submissionResult.hidden = false;
    return;
  }
  const files = selectedPhotos();
  if (!totalPhotoCount() || totalPhotoCount() > 5 || files.some((file) => file.size > 8 * 1024 * 1024)) {
    submissionResult.textContent = "Проверьте фотографии: нужно 1–5 файлов, каждый не более 8 МБ.";
    submissionResult.hidden = false;
    return;
  }
  const button = submissionForm.querySelector('[type="submit"]');
  button.disabled = true;
  button.textContent = "Отправляем…";
  submissionResult.hidden = true;
  try {
    const formData = new FormData(submissionForm);
    formData.set("submission_id", submissionAttemptId);
    importedPhotos.forEach((url) => formData.append("import_photo_url", url));
    const telegram = window.Telegram?.WebApp;
    if (telegram?.initData) formData.set("telegram_init_data", telegram.initData);
    const response = await fetch("/api/submissions", {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "submit_failed");
    submissionResult.classList.add("is-success");
    submissionResult.textContent = "Объявление на модерации. Оно сохранено и ожидает проверки администратором. Статус можно посмотреть в разделе «Мои объявления».";
    submissionResult.hidden = false;
    submissionForm.reset();
    submissionAttemptId = crypto.randomUUID();
    updateDescriptionCount();
    chosenPhotos = [];
    importedPhotos = [];
    submissionSourceUrl.value = "";
    if (lalafoImportUrl) lalafoImportUrl.value = "";
    setImportStatus("Импорт не публикует объект автоматически.");
    clearLocationButton?.click();
    updateContractQuestion();
    submissionPhotoPreview.replaceChildren();
    submissionPhotoLabel.textContent = "Файлы не выбраны";
    submissionResult.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    submissionResult.classList.remove("is-success");
    const messages = {
      registration_required: "Войдите в аккаунт Liberterra и повторите отправку. Данные формы не удалены.",
      web_agent_attribution_unavailable: "Для этой отправки выберите размещение от своего имени. Передача объявления другому агенту пока недоступна.",
      submission_busy: "Другая отправка ещё обрабатывается. Подождите немного и повторите попытку — повторная заявка не будет создана.",
      photos_too_large: "Общий размер фотографий превышает 24 МБ. Уменьшите размер файлов и повторите отправку.",
      submission_unconfirmed: "Сервер не подтвердил результат. Проверьте «Мои объявления» или повторите отправку с этой страницы: номер заявки сохранён для защиты от дубликатов.",
      account_service_unavailable: "Сервис проверки аккаунта временно недоступен. Данные формы сохранены на этой странице. Попробуйте позже.",
      invalid_origin: "Откройте форму на liberterra.kg и войдите в аккаунт перед отправкой.",
      invalid_price: "Укажите цену больше нуля, используя только цифры и точку для копеек.",
      invalid_address: "Проверьте адрес объекта.",
      invalid_photo_count: "Проверьте количество фотографий в форме.",
      invalid_photo: "Одна из фотографий имеет неподдерживаемый формат или слишком большой размер.",
      consent_required: "Подтвердите согласие на размещение объекта и обработку данных.",
      notification_failed: "Не удалось подтвердить передачу объявления на проверку. Перед повторной отправкой проверьте «Мои объявления», чтобы не создать дубликат.",
      admin_required: "Только администратор может размещать объект от имени другого агента.",
      invalid_listing_agent: "Выбранный агент больше не активен. Обновите страницу и выберите другого.",
      agents_unavailable: "Не удалось проверить выбранного агента. Попробуйте ещё раз через минуту.",
      imported_photo_failed: "Не удалось перенести одну из импортированных фотографий. Удалите её и добавьте фотографию вручную.",
    };
    submissionResult.textContent = messages[error.message] || (error.message.startsWith("required_")
      ? "Заполните все обязательные поля. Данные формы не удалены."
      : "Не удалось подтвердить отправку объявления. Данные формы не удалены. Перед повторной отправкой проверьте «Мои объявления», чтобы не создать дубликат.");
    submissionResult.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Отправить на проверку";
  }
});
