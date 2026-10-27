/* Local review of the existing shared form; never sends or persists listing data. */
(function (root) {
  "use strict";
  const labels = {deal:"Тип сделки",object_type:"Тип объекта",address:"Адрес",rooms:"Комнат",area:"Площадь, м²",floor:"Этаж",total_floors:"Этажей в доме",price:"Цена",price_currency:"Валюта",price_basis:"Расчёт цены"};
  const text = value => String(value ?? "").trim();
  const positive = value => /^\d+(?:[.,]\d+)?$/.test(text(value)) && Number(text(value).replace(",", ".")) > 0;
  const integer = value => /^\d+$/.test(text(value)) && Number(value) > 0;
  function inspect(values, photos) {
    const issues = [];
    for (const key of ["deal", "object_type", "address", "price_currency", "price_basis"]) {
      if (!text(values[key])) issues.push(labels[key]);
    }
    if (!positive(values.price)) issues.push("Цена больше нуля");
    if (!positive(values.area)) issues.push("Площадь больше нуля");
    if (["Квартира", "Дом", "Комната"].includes(values.object_type) && !integer(values.rooms)) issues.push("Количество комнат");
    if (["Квартира", "Комната"].includes(values.object_type)) {
      if (!/^\d{1,3}$/.test(text(values.floor))) issues.push("Этаж (0 для цоколя)");
      if (!integer(values.total_floors)) issues.push("Этажность дома");
      if (Number(values.floor) > Number(values.total_floors)) issues.push("Этаж не может быть выше этажности дома");
    }
    if (values.object_type === "Дом" && !integer(values.total_floors)) issues.push("Этажность дома");
    if (!Number.isInteger(photos) || photos < 1 || photos > 5) issues.push("От 1 до 5 фотографий");
    return issues;
  }
  function signature(values, photos) { return JSON.stringify([values, photos]); }
  if (typeof module === "object" && module.exports) module.exports = {inspect, signature};
  if (!root.document) return;
  const form = document.querySelector("#objectSubmissionForm");
  if (!form) return;
  const panel = document.querySelector("#placementReview");
  const summary = document.querySelector("#placementSummary");
  const issues = document.querySelector("#placementIssues");
  const confirm = document.querySelector("#placementConfirmed");
  let reviewed = "";
  function snapshot() {
    const values = {};
    // Includes source, photos and contact edits so any change invalidates review.
    for (const field of form.elements) {
      if (!field.name || field.type === "file" || field === confirm) continue;
      values[field.name] = field.type === "checkbox" ? field.checked : field.value;
    }
    const photos = Array.from(document.querySelectorAll("#submissionPhotoPreview img"), image => image.getAttribute("src"));
    return {values, photos, key:signature(values, photos)};
  }
  function invalidate() { reviewed = ""; confirm.checked = false; }
  function showReview() {
    const state = snapshot();
    const missing = inspect(state.values, state.photos.length);
    summary.replaceChildren();
    for (const [key, label] of Object.entries(labels)) {
      const row = document.createElement("li");
      row.textContent = `${label}: ${text(state.values[key]) || "не указано / проверьте применимость"}`;
      summary.append(row);
    }
    const source = document.createElement("li");
    source.textContent = `Источник: ${text(state.values.source_url) || "ручное заполнение"}. Фотографий: ${state.photos.length}`;
    summary.append(source);
    issues.textContent = missing.length ? `Заполните или исправьте: ${missing.join("; ")}.` : "Обязательные параметры заполнены. Сверьте данные и фотографии с объектом.";
    confirm.disabled = missing.length > 0;
    confirm.checked = false;
    reviewed = missing.length ? "" : state.key;
    panel.hidden = false;
    panel.scrollIntoView({behavior:"smooth",block:"center"});
    issues.focus();
  }
  const onEdit = event => { if (event.target !== confirm) invalidate(); };
  form.addEventListener("input", onEdit);
  form.addEventListener("change", onEdit);
  form.addEventListener("reset", () => { invalidate(); panel.hidden = true; });
  document.querySelector("#placementReviewButton").addEventListener("click", showReview);
  // Capture runs before the existing async submit handler (and its network calls).
  form.addEventListener("submit", event => {
    const state = snapshot();
    if (!confirm.checked || !reviewed || reviewed !== state.key || inspect(state.values, state.photos.length).length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showReview();
    }
  }, true);
  document.querySelector("#placementImportChoice").addEventListener("click", () => {
    document.querySelector("#lalafoImportUrl").focus();
  });
  document.querySelector("#placementManualChoice").addEventListener("click", () => {
    form.scrollIntoView({behavior:"smooth",block:"start"});
    form.elements.namedItem("deal").focus({preventScroll:true});
  });
  const status = document.querySelector("#lalafoImportStatus");
  new MutationObserver(() => {
    invalidate();
    if (status.classList.contains("is-success")) showReview();
  }).observe(status, {childList:true,characterData:true,subtree:true});
})(typeof window === "object" ? window : globalThis);
