const requestForm = document.querySelector("#searchRequestForm");
const requestResult = document.querySelector("#requestResult");
const districtList = document.querySelector("#submissionDistricts");
if (districtList && Array.isArray(window.LIBERTERRA_DISTRICTS)) {
  districtList.replaceChildren(...window.LIBERTERRA_DISTRICTS.map((district) => {
    const option = document.createElement("option"); option.value = district; return option;
  }));
}
requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requestForm.reportValidity()) return;
  const button = requestForm.querySelector('[type="submit"]'); button.disabled = true; button.textContent = "Отправляем…"; requestResult.hidden = true;
  try {
    const formData = new FormData(requestForm);
    const telegram = window.Telegram?.WebApp;
    if (telegram?.initData) formData.set("telegram_init_data", telegram.initData);
    const response = await fetch("/api/requests", { method: "POST", body: formData });
    const result = await response.json().catch(() => ({})); if (!response.ok || !result.ok) throw new Error(result.error || "submit_failed");
    requestResult.classList.add("is-success"); requestResult.textContent = `Заявка № ${result.id.slice(0, 8).toUpperCase()} опубликована в каталоге. Агенты смогут её увидеть и связаться с вами.`; requestResult.hidden = false; requestForm.reset(); requestResult.scrollIntoView({ behavior: "smooth", block: "center" });
    window.LiberterraAnalytics?.trackEvent("click", {
      action_name: "request_submitted",
      button_label: "Заявка успешно отправлена",
      target: `request:${result.id.slice(0, 8)}`,
    });
  } catch (error) {
    requestResult.classList.remove("is-success"); requestResult.textContent = "Не удалось отправить заявку. Проверьте интернет и попробуйте ещё раз."; requestResult.hidden = false;
  } finally { button.disabled = false; button.textContent = "Отправить заявку"; }
});
