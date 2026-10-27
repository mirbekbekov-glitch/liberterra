(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function formatPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("996")) return `+996 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    return String(value || "");
  }

  function whatsappLink(value, message) {
    try {
      const link = new URL(String(value || ""));
      if (message) link.searchParams.set("text", message);
      return link.toString();
    } catch (_) {
      return String(value || "");
    }
  }

  function showContact(id, contact, message = "") {
    const safeId = String(id);
    const phone = formatPhone(contact.phone);
    document.querySelectorAll(`[data-contact-phone="${CSS.escape(safeId)}"]`).forEach((node) => {
      node.innerHTML = `<a class="object-contact-phone" href="tel:${escapeHtml(contact.tel)}">${escapeHtml(phone)}</a>`;
    });
    document.querySelectorAll(`[data-contact-gate-wrap="${CSS.escape(safeId)}"]`).forEach((node) => {
      node.innerHTML = `<a class="card-action primary" href="tel:${escapeHtml(contact.tel)}">Позвонить</a><a class="card-action secondary" href="${escapeHtml(whatsappLink(contact.whatsapp, message))}" target="_blank" rel="noopener">WhatsApp</a>`;
    });
    document.querySelectorAll(`[data-contact-whatsapp="${CSS.escape(safeId)}"]`).forEach((node) => {
      node.outerHTML = `<a class="card-action primary object-message-action" href="${escapeHtml(whatsappLink(contact.whatsapp, message))}" target="_blank" rel="noopener">WhatsApp</a>`;
    });
  }

  async function loadPreview(node) {
    const id = String(node.dataset.contactPreview || "").trim();
    const value = node.querySelector("[data-contact-preview-value]");
    if (!id || !value) return;
    try {
      const response = await fetch(`/api/listing-contact-preview?id=${encodeURIComponent(id)}`, { cache: "force-cache" });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok && data.masked) value.textContent = data.masked;
    } catch (_) {
      // Keep the neutral placeholder if the preview service is temporarily unavailable.
    }
  }

  function hydratePreviews(root = document) {
    root.querySelectorAll("[data-contact-preview]").forEach(loadPreview);
  }

  async function reveal(button) {
    const id = String(button.dataset.contactGate || "").trim();
    if (!id) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Открываем…";
    try {
      let response = await fetch(`/api/listing-contact?id=${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) {
        // Keep the visitor on the listing. After login, repeat the exact action
        // (reveal, call, or WhatsApp) that they originally requested.
        pendingContact = button;
        button.disabled = false;
        button.textContent = original;
        if (window.LiberterraUserAccess?.openLogin?.()) return;
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/profile.html?auth=login&next=${encodeURIComponent(next)}`);
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "contact_unavailable");
      const openWhatsApp = button.dataset.contactWhatsapp === id;
      const openCall = button.dataset.contactCall === id;
      const message = String(button.dataset.contactMessage || "").trim();
      const whatsapp = whatsappLink(data.whatsapp, message);
      showContact(id, data, message);
      // Keep this tied to the user's click. On mobile wa.me hands the visitor
      // straight to the WhatsApp app; in a desktop browser it opens WhatsApp Web.
      if (openWhatsApp) window.location.assign(whatsapp);
      if (openCall) window.location.assign(data.tel);
    } catch (error) {
      button.disabled = false;
      button.textContent = ["authorization_required", "registration_required"].includes(error.message) ? "Войдите, чтобы открыть номер" : "Номер временно недоступен";
      window.setTimeout(() => { if (button.isConnected && button.disabled === false) button.textContent = original; }, 2600);
    }
  }

  let pendingContact = null;

  window.addEventListener("liberterra:user-registered", () => {
    const button = pendingContact;
    pendingContact = null;
    if (button?.isConnected) reveal(button);
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-contact-gate]");
    if (!button) return;
    event.preventDefault();
    reveal(button);
  });

  document.addEventListener("DOMContentLoaded", () => {
    hydratePreviews();
  });
  document.addEventListener("liberterra:contact-preview", (event) => hydratePreviews(event.target || document));
}());
