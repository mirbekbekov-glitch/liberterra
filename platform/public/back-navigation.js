(() => {
  "use strict";
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-smart-back]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    let sameOriginReferrer = false;
    try { sameOriginReferrer = Boolean(document.referrer && new URL(document.referrer).origin === window.location.origin); } catch (_) {}
    if (!sameOriginReferrer || window.history.length <= 1) return;
    event.preventDefault();
    window.history.back();
  });
})();
